/**
 * Utilitários centralizados de formatação e validação
 * Lucro Líquido - Sistema de Gestão Financeira
 */

// ============================================
// FORMATAÇÃO MONETÁRIA (BRL)
// ============================================

/**
 * Formata um valor numérico para o padrão monetário brasileiro
 * @param {number|string} value - Valor a ser formatado
 * @param {boolean} showSymbol - Se deve mostrar o símbolo R$ (default: true)
 * @returns {string} Valor formatado (ex: "R$ 10.000,00")
 */
export function formatBRL(value, showSymbol = true) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue) || numericValue === null || numericValue === undefined) {
    return showSymbol ? 'R$ 0,00' : '0,00';
  }
  
  if (showSymbol) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  }
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/**
 * Converte uma string formatada em BRL para número decimal
 * Aceita formatos: "R$ 10.000,00", "10.000,00", "10000,00", "10000.00", "10000"
 * @param {string} value - String com valor monetário
 * @returns {number} Valor numérico (ex: 10000.00)
 */
export function parseBRL(value) {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  // Remove o símbolo R$, espaços e qualquer caractere não numérico exceto . e ,
  let cleaned = String(value)
    .replace(/R\$\s?/gi, '')
    .trim();
  
  // Detecta o formato: brasileiro (1.234,56) ou americano (1,234.56)
  const hasCommaAsDecimal = /,\d{2}$/.test(cleaned);
  const hasDotAsDecimal = /\.\d{2}$/.test(cleaned) && !/,/.test(cleaned);
  
  if (hasCommaAsDecimal) {
    // Formato brasileiro: 1.234,56 -> 1234.56
    cleaned = cleaned
      .replace(/\./g, '')  // Remove pontos (separador de milhar)
      .replace(',', '.');   // Troca vírgula por ponto (decimal)
  } else if (!hasDotAsDecimal) {
    // Se não tem vírgula nem ponto como decimal, remove pontos e trata vírgula
    cleaned = cleaned
      .replace(/\./g, '')
      .replace(',', '.');
  }
  
  // Remove qualquer caractere que não seja número, ponto ou sinal negativo
  cleaned = cleaned.replace(/[^\d.-]/g, '');
  
  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

/**
 * Aplica máscara monetária BRL enquanto o usuário digita
 * @param {string} value - Valor digitado
 * @returns {string} Valor com máscara aplicada
 */
export function maskBRL(value) {
  // Remove tudo exceto dígitos
  let digits = String(value).replace(/\D/g, '');
  
  if (digits === '') return '';
  
  // Converte para centavos e depois para reais
  const numericValue = parseInt(digits, 10) / 100;
  
  return formatBRL(numericValue, false);
}

/**
 * Formata valor para input monetário (sem símbolo, para edição)
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado sem símbolo
 */
export function formatInputBRL(value) {
  return formatBRL(value, false);
}

// ============================================
// VALIDAÇÃO E FORMATAÇÃO CPF/CNPJ
// ============================================

/**
 * Remove caracteres não numéricos de uma string
 * @param {string} value - String com máscara
 * @returns {string} Apenas dígitos
 */
export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 * @param {string} value - Valor a ser mascarado
 * @returns {string} CPF formatado
 */
export function maskCPF(value) {
  return onlyDigits(value)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
    .slice(0, 14);
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * @param {string} value - Valor a ser mascarado
 * @returns {string} CNPJ formatado
 */
export function maskCNPJ(value) {
  return onlyDigits(value)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
    .slice(0, 18);
}

/**
 * Aplica máscara de CPF ou CNPJ baseado no tamanho
 * @param {string} value - Valor a ser mascarado
 * @returns {string} Documento formatado
 */
export function maskCpfCnpj(value) {
  const digits = onlyDigits(value);
  return digits.length <= 11 ? maskCPF(value) : maskCNPJ(value);
}

/**
 * Valida CPF brasileiro com algoritmo oficial
 * @param {string} cpf - CPF a ser validado (com ou sem máscara)
 * @returns {boolean} true se válido
 */
export function isValidCPF(cpf) {
  const digits = onlyDigits(cpf);
  
  // CPF deve ter 11 dígitos
  if (digits.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Cálculo do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  let digito1 = resto === 10 || resto === 11 ? 0 : resto;
  
  if (digito1 !== parseInt(digits[9])) return false;
  
  // Cálculo do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  let digito2 = resto === 10 || resto === 11 ? 0 : resto;
  
  return digito2 === parseInt(digits[10]);
}

/**
 * Valida CNPJ brasileiro com algoritmo oficial
 * @param {string} cnpj - CNPJ a ser validado (com ou sem máscara)
 * @returns {boolean} true se válido
 */
export function isValidCNPJ(cnpj) {
  const digits = onlyDigits(cnpj);
  
  // CNPJ deve ter 14 dígitos
  if (digits.length !== 14) return false;
  
  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Cálculo do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(digits[i]) * pesos1[i];
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  
  if (digito1 !== parseInt(digits[12])) return false;
  
  // Cálculo do segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(digits[i]) * pesos2[i];
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  
  return digito2 === parseInt(digits[13]);
}

/**
 * Valida CPF ou CNPJ baseado no tamanho
 * @param {string} value - Documento a ser validado
 * @returns {boolean} true se válido
 */
export function isValidCpfOrCnpj(value) {
  const digits = onlyDigits(value);
  
  if (digits.length === 11) return isValidCPF(value);
  if (digits.length === 14) return isValidCNPJ(value);
  
  return false;
}

/**
 * Retorna mensagem de erro para CPF/CNPJ inválido
 * @param {string} value - Documento a ser validado
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export function getCpfCnpjError(value) {
  if (!value || value.trim() === '') return null; // Campo vazio - depende se é obrigatório
  
  const digits = onlyDigits(value);
  
  if (digits.length === 0) return null;
  
  if (digits.length < 11) return 'CPF incompleto';
  if (digits.length === 11 && !isValidCPF(value)) return 'CPF inválido';
  if (digits.length > 11 && digits.length < 14) return 'CNPJ incompleto';
  if (digits.length === 14 && !isValidCNPJ(value)) return 'CNPJ inválido';
  if (digits.length > 14) return 'Documento inválido';
  
  return null;
}

// ============================================
// FORMATAÇÃO DE TELEFONE
// ============================================

/**
 * Aplica máscara de telefone brasileiro
 * @param {string} value - Número de telefone
 * @returns {string} Telefone formatado
 */
export function maskPhone(value) {
  const digits = onlyDigits(value);
  
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

// ============================================
// FORMATAÇÃO DE DATA
// ============================================

/**
 * Formata data para padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (ex: "21/12/2024")
 */
export function formatDateBR(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para padrão brasileiro
 * @param {string|Date} date - Data/hora a ser formatada
 * @returns {string} Data/hora formatada (ex: "21/12/2024 14:30")
 */
export function formatDateTimeBR(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
