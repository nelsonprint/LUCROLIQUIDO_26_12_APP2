/**
 * Input Monetário com máscara BRL
 * Componente reutilizável para campos de valor monetário
 */
import React, { useState, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { formatBRL, parseBRL } from '@/lib/formatters';

/**
 * Input monetário com formatação automática BRL
 * 
 * @param {Object} props
 * @param {number} props.value - Valor numérico (ex: 1000.50)
 * @param {function} props.onChange - Callback com valor numérico (ex: onChange(1000.50))
 * @param {boolean} props.showSymbol - Mostrar "R$" (default: true)
 * @param {string} props.placeholder - Placeholder do input
 * @param {string} props.className - Classes CSS adicionais
 * @param {boolean} props.disabled - Se o input está desabilitado
 * @param {Object} props.rest - Outras props do Input
 */
export function MoneyInput({ 
  value, 
  onChange, 
  showSymbol = true,
  placeholder = '0,00',
  className = '',
  disabled = false,
  ...rest 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  
  // Calcula o valor de exibição baseado no valor externo
  const displayValue = useMemo(() => {
    if (isEditing) return editValue;
    if (value !== undefined && value !== null && value !== 0) {
      return formatBRL(value, false);
    }
    return '';
  }, [value, isEditing, editValue]);
  
  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove tudo exceto dígitos
    const digits = inputValue.replace(/\D/g, '');
    
    if (digits === '') {
      setEditValue('');
      onChange?.(0);
      return;
    }
    
    // Converte para centavos e depois para reais
    const numericValue = parseInt(digits, 10) / 100;
    
    // Formata para exibição
    const formatted = formatBRL(numericValue, false);
    setEditValue(formatted);
    
    // Retorna valor numérico para o parent
    onChange?.(numericValue);
  };
  
  const handleFocus = (e) => {
    setIsEditing(true);
    setEditValue(value ? formatBRL(value, false) : '');
    // Seleciona todo o texto ao focar
    setTimeout(() => {
      e.target.select();
    }, 0);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numericValue = parseBRL(pastedText);
    
    const formatted = formatBRL(numericValue, false);
    setEditValue(formatted);
    onChange?.(numericValue);
  };

  return (
    <div className="relative">
      {showSymbol && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          R$
        </span>
      )}
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={`${showSymbol ? 'pl-10' : ''} ${className}`}
        {...rest}
      />
    </div>
  );
}

export default MoneyInput;
