/**
 * Input CPF/CNPJ com máscara e validação
 * Componente reutilizável para campos de documento
 */
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { 
  maskCPF, 
  maskCNPJ, 
  maskCpfCnpj,
  isValidCPF, 
  isValidCNPJ, 
  getCpfCnpjError,
  onlyDigits 
} from '@/lib/formatters';

/**
 * Input para CPF com máscara e validação
 * 
 * @param {Object} props
 * @param {string} props.value - Valor do CPF
 * @param {function} props.onChange - Callback com valor mascarado
 * @param {function} props.onValidation - Callback com resultado da validação (isValid, errorMessage)
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {string} props.className - Classes CSS adicionais
 */
export function CPFInput({ 
  value, 
  onChange, 
  onValidation,
  required = false,
  className = '',
  ...rest 
}) {
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const masked = maskCPF(e.target.value);
    onChange?.(masked);
  };
  
  const handleBlur = () => {
    const digits = onlyDigits(value);
    
    if (!value || digits.length === 0) {
      if (required) {
        setError('CPF é obrigatório');
        onValidation?.(false, 'CPF é obrigatório');
      } else {
        setError('');
        onValidation?.(true, null);
      }
      return;
    }
    
    if (digits.length < 11) {
      setError('CPF incompleto');
      onValidation?.(false, 'CPF incompleto');
      return;
    }
    
    if (!isValidCPF(value)) {
      setError('CPF inválido');
      onValidation?.(false, 'CPF inválido');
      return;
    }
    
    setError('');
    onValidation?.(true, null);
  };

  return (
    <div className="space-y-1">
      <Input
        type="text"
        inputMode="numeric"
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="000.000.000-00"
        maxLength={14}
        className={`${error ? 'border-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Input para CNPJ com máscara e validação
 * 
 * @param {Object} props
 * @param {string} props.value - Valor do CNPJ
 * @param {function} props.onChange - Callback com valor mascarado
 * @param {function} props.onValidation - Callback com resultado da validação
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {string} props.className - Classes CSS adicionais
 */
export function CNPJInput({ 
  value, 
  onChange, 
  onValidation,
  required = false,
  className = '',
  ...rest 
}) {
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const masked = maskCNPJ(e.target.value);
    onChange?.(masked);
  };
  
  const handleBlur = () => {
    const digits = onlyDigits(value);
    
    if (!value || digits.length === 0) {
      if (required) {
        setError('CNPJ é obrigatório');
        onValidation?.(false, 'CNPJ é obrigatório');
      } else {
        setError('');
        onValidation?.(true, null);
      }
      return;
    }
    
    if (digits.length < 14) {
      setError('CNPJ incompleto');
      onValidation?.(false, 'CNPJ incompleto');
      return;
    }
    
    if (!isValidCNPJ(value)) {
      setError('CNPJ inválido');
      onValidation?.(false, 'CNPJ inválido');
      return;
    }
    
    setError('');
    onValidation?.(true, null);
  };

  return (
    <div className="space-y-1">
      <Input
        type="text"
        inputMode="numeric"
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="00.000.000/0000-00"
        maxLength={18}
        className={`${error ? 'border-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Input que aceita CPF ou CNPJ com detecção automática
 * 
 * @param {Object} props
 * @param {string} props.value - Valor do documento
 * @param {function} props.onChange - Callback com valor mascarado
 * @param {function} props.onValidation - Callback com resultado da validação
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {string} props.className - Classes CSS adicionais
 */
export function CpfCnpjInput({ 
  value, 
  onChange, 
  onValidation,
  required = false,
  className = '',
  ...rest 
}) {
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const masked = maskCpfCnpj(e.target.value);
    onChange?.(masked);
  };
  
  const handleBlur = () => {
    const digits = onlyDigits(value);
    
    if (!value || digits.length === 0) {
      if (required) {
        setError('CPF/CNPJ é obrigatório');
        onValidation?.(false, 'CPF/CNPJ é obrigatório');
      } else {
        setError('');
        onValidation?.(true, null);
      }
      return;
    }
    
    const errorMsg = getCpfCnpjError(value);
    if (errorMsg) {
      setError(errorMsg);
      onValidation?.(false, errorMsg);
      return;
    }
    
    setError('');
    onValidation?.(true, null);
  };

  return (
    <div className="space-y-1">
      <Input
        type="text"
        inputMode="numeric"
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="CPF ou CNPJ"
        maxLength={18}
        className={`${error ? 'border-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export default { CPFInput, CNPJInput, CpfCnpjInput };
