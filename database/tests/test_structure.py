import unittest

from database.seed import criar_dados, main


class StructureTests(unittest.TestCase):
    def test_seed_contem_somente_catalogo(self):
        records = criar_dados()
        collections = {collection for collection, _, _ in records}
        self.assertEqual(collections, {'categorias', 'tipos_servico'})
        self.assertEqual(len(records), 12)

    def test_ids_sao_estaveis_e_referencias_validas(self):
        records = criar_dados()
        keys = {(collection, doc_id) for collection, doc_id, _ in records}
        self.assertEqual(len(keys), len(records))
        for collection, _, data in records:
            self.assertTrue(data['demonstracao'])
            if collection == 'tipos_servico':
                self.assertIn(('categorias', data['categoria_id']), keys)

    def test_producao_exige_projeto_explicito(self):
        with self.assertRaises(SystemExit):
            main(['--production'])


if __name__ == '__main__':
    unittest.main()
