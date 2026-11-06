import unittest
from database.seed import criar_dados, main
from backend.app.services.pedidos import dividir_pagamento, validar_avaliacao, validar_cliente, RegraNegocioError


class StructureTests(unittest.TestCase):
    def test_seed_has_stable_unique_ids_and_valid_references(self):
        records = criar_dados()
        keys = {(collection, doc_id) for collection, doc_id, _ in records}
        self.assertEqual(len(keys), len(records))
        self.assertEqual(keys, {(collection, doc_id) for collection, doc_id, _ in criar_dados()})
        for collection, doc_id, data in records:
            self.assertTrue(data['demonstracao'])
            self.assertNotIn('senha', data)
            if collection == 'usuarios':
                self.assertTrue(doc_id.startswith('demo_'))
                self.assertEqual(data['papel'], 'USUARIO')
            if collection == 'perfis_prestadores':
                self.assertIn(('usuarios', doc_id), keys)
                self.assertIn(('instituicoes', data['instituicao_id']), keys)
                self.assertFalse(data['verificado'])
            if collection == 'servicos':
                self.assertIn(('usuarios', data['prestador_uid']), keys)
                self.assertIn(('categorias', data['categoria_id']), keys)
                self.assertIn(('tipos_servico', data['tipo_servico_id']), keys)

    def test_seed_never_creates_orders_or_payments(self):
        self.assertTrue({'pedidos', 'pagamentos', 'avaliacoes', 'mensagens'}.isdisjoint({collection for collection, _, _ in criar_dados()}))

    def test_production_requires_explicit_project(self):
        with self.assertRaises(SystemExit):
            main(['--production'])

    def test_money_rounding_and_conservation(self):
        for value in (1, 5, 100, 14900, 25000, 100_000_000):
            for rate in (1000, 1250, 1500):
                parts = dividir_pagamento(value, rate)
                self.assertEqual(value, parts['valor_comissao_centavos'] + parts['valor_prestador_centavos'])
        self.assertEqual(dividir_pagamento(5, 1000)['valor_comissao_centavos'], 1)

    def test_invalid_money_and_commission(self):
        for value in (0, -1, 1.5, True, 100_000_001):
            with self.subTest(value=value), self.assertRaises(RegraNegocioError):
                dividir_pagamento(value, 1000)
        for rate in (999, 1501, True, 1200.0):
            with self.subTest(rate=rate), self.assertRaises(RegraNegocioError):
                dividir_pagamento(100, rate)

    def test_only_customer_can_approve_and_no_self_contract(self):
        validar_cliente({'cliente_uid': 'a', 'prestador_uid': 'b'}, 'a')
        with self.assertRaises(RegraNegocioError):
            validar_cliente({'cliente_uid': 'a', 'prestador_uid': 'b'}, 'b')
        with self.assertRaises(RegraNegocioError):
            validar_cliente({'cliente_uid': 'a', 'prestador_uid': 'a'}, 'a')

    def test_rating_constraints(self):
        validar_avaliacao(5, 'Ótimo trabalho')
        for rating in (0, 6, 4.5, True):
            with self.subTest(rating=rating), self.assertRaises(RegraNegocioError):
                validar_avaliacao(rating, '')
        with self.assertRaises(RegraNegocioError):
            validar_avaliacao(5, 'x' * 2001)


if __name__ == '__main__':
    unittest.main()
