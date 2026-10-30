import { useState } from 'react';
import Icon from '../Icon.jsx';

export default function PasswordField({ id = 'password', label = 'Senha', autoComplete = 'current-password', minLength, hint }) {
  const [visible, setVisible] = useState(false);
  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <div className="password-input"><input id={id} name={id} type={visible ? 'text' : 'password'} required autoComplete={autoComplete} minLength={minLength} maxLength={128} placeholder={autoComplete === 'new-password' ? 'Crie uma senha segura' : 'Sua senha'} aria-describedby={hint ? `${id}-hint` : undefined} /><button type="button" className="icon-button" onClick={() => setVisible(!visible)} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible}><Icon name={visible ? 'eyeOff' : 'eye'} /></button></div>
    {hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
  </div>;
}
