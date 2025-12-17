-- Script para atualizar o registro do Pedal na tabela "stryker 5400-50 core console + pedal"
-- Execute este script no SQL Editor do Supabase

UPDATE "stryker 5400-50 core console + pedal"
SET
  nome = 'STRYKER 5100-008-000 TPS Foot Switch',
  codigo = '5100-008-000',
  descricao = 'Função do Pedal
Permite controle dos botões A e B durante procedimentos cirúrgicos variados para maior facilidade.

Configurações Flexíveis
Oferece três opções de configuração para adaptar funções conforme a necessidade do procedimento. Compatível com diversos dispositivos, ampliando seu uso em diferentes contextos clínicos.

Melhora no Fluxo e Segurança
O uso do pedal melhora o fluxo de trabalho e aumenta a segurança operacional em cirurgias.'
WHERE id = 2;

-- Verificar a atualização
SELECT * FROM "stryker 5400-50 core console + pedal" WHERE id = 2;
