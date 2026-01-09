/**
 * Utilitários para geração de links do WhatsApp
 */

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511940201088';

/**
 * Gera link do WhatsApp com mensagem pré-formatada
 * @param message - Mensagem a ser enviada
 * @returns URL do WhatsApp Web
 */
export function getWhatsAppLink(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Gera link do WhatsApp para solicitar catálogo de categoria
 * @param nomeCategoria - Nome da categoria
 * @returns URL do WhatsApp com mensagem sobre catálogo
 */
export function getWhatsAppCatalogoLink(nomeCategoria: string): string {
  const message = `Olá, quero ver o catálogo completo da categoria ${nomeCategoria}.`;
  return getWhatsAppLink(message);
}

/**
 * Gera link do WhatsApp para solicitar orçamento de produto
 * @param nomeProduto - Nome do produto
 * @returns URL do WhatsApp com mensagem sobre orçamento
 */
export function getWhatsAppProdutoLink(nomeProduto: string): string {
  const message = `Olá, tenho interesse no produto ${nomeProduto} e gostaria de mais informações e condições de locação.`;
  return getWhatsAppLink(message);
}

/**
 * Gera link genérico do WhatsApp
 * @returns URL do WhatsApp
 */
export function getWhatsAppGenericLink(): string {
  const message = 'Olá, gostaria de mais informações sobre os serviços da PenseMed.';
  return getWhatsAppLink(message);
}
