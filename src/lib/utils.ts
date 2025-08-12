import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility para combinar classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar CPF/CNPJ
export function formatCpfCnpj(value: string): string {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
}

// Validar CPF
export function validarCpf(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");

  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers[10])) return false;

  return true;
}

// Validar CNPJ
export function validarCnpj(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, "");

  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers[13])) return false;

  return true;
}

// Validar CPF ou CNPJ
export function validarCpfCnpj(value: string): boolean {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length === 11) {
    return validarCpf(value);
  } else if (numbers.length === 14) {
    return validarCnpj(value);
  }

  return false;
}

// Formatar telefone
export function formatTelefone(value: string): string {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else {
    // Celular: (00) 00000-0000
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
}

// Formatar moeda (Real brasileiro)
export function formatMoeda(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Formatar data
export function formatData(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

// Formatar data e hora
export function formatDataHora(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Calcular idade a partir de data de nascimento
export function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mes = hoje.getMonth() - dataNascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }

  return idade;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Normalizar string para pesquisa (remover acentos, converter para lowercase)
export function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Filtrar array por texto de pesquisa
export function filterBySearch<T>(
  items: T[],
  searchText: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchText.trim()) return items;

  const normalizedSearch = normalizeString(searchText);

  return items.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (typeof value === "string") {
        return normalizeString(value).includes(normalizedSearch);
      }
      return false;
    })
  );
}

// Gerar ID único simples
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Verificar se é um dispositivo móvel
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Converter File para base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Download de arquivo
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Copiar texto para clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Erro ao copiar para clipboard:", err);
    return false;
  }
}
