-- =====================================================
-- SCHEMA SQL PARA SUPABASE - PENSEMED
-- Tabela de produtos para o catálogo de equipamentos médicos
-- =====================================================

-- Criar a tabela produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria TEXT NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descricao_curta TEXT NOT NULL,
    aplicacao TEXT,
    descricao_tecnica TEXT,
    caracteristicas_beneficios TEXT,
    itens_inclusos TEXT,
    preco_referencia TEXT,
    codigo_anvisa TEXT,
    codigo_produto TEXT,
    imagem_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON public.produtos(slug);
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON public.produtos(created_at DESC);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_produtos_updated_at
    BEFORE UPDATE ON public.produtos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (todos podem ler)
CREATE POLICY "Produtos são visíveis publicamente"
    ON public.produtos
    FOR SELECT
    USING (true);

-- Política de inserção (apenas autenticados podem inserir - ajuste conforme necessário)
CREATE POLICY "Apenas usuários autenticados podem inserir produtos"
    ON public.produtos
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização (apenas autenticados podem atualizar - ajuste conforme necessário)
CREATE POLICY "Apenas usuários autenticados podem atualizar produtos"
    ON public.produtos
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política de deleção (apenas autenticados podem deletar - ajuste conforme necessário)
CREATE POLICY "Apenas usuários autenticados podem deletar produtos"
    ON public.produtos
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- =====================================================
-- EXEMPLOS DE INSERÇÃO
-- =====================================================

-- Exemplo 1: Equipamento Médico
INSERT INTO public.produtos (
    categoria,
    nome,
    slug,
    descricao_curta,
    aplicacao,
    descricao_tecnica,
    caracteristicas_beneficios,
    itens_inclusos,
    preco_referencia,
    codigo_produto,
    codigo_anvisa,
    imagem_url
) VALUES (
    'Equipamentos Médicos',
    'Monitor Multiparâmetros Portátil',
    'monitor-multiparametros-portatil',
    'Monitor multiparâmetros portátil com tela TFT LCD de alta resolução, ideal para UTI, centro cirúrgico e emergência.',
    'Indicado para monitoramento contínuo de sinais vitais em pacientes críticos e semi-críticos em ambiente hospitalar, centro cirúrgico, UTI e pronto atendimento.',
    'Monitor de 12 polegadas com tecnologia TFT LCD, capaz de monitorar até 8 parâmetros simultaneamente incluindo ECG, SpO2, PANI, temperatura, respiração e frequência cardíaca. Alimentação bivolt automática 110-220V.',
    'Tela LCD de alta definição 12 polegadas
Monitoramento de ECG com 5 derivações
SpO2 com tecnologia Masimo
Medição de pressão arterial não invasiva (PANI)
2 canais de temperatura
Frequência respiratória
Bateria interna com autonomia de 4 horas
Alarmes visuais e sonoros configuráveis
Interface intuitiva e fácil operação',
    'Monitor multiparâmetros
Cabo de ECG com 5 derivações
Sensor de SpO2 adulto
Manguito para PANI (adulto)
Sensor de temperatura
Cabo de alimentação
Manual em português
Maleta de transporte',
    'A partir de R$ 450,00/dia - Valores especiais para locação mensal',
    'MON-MP-2024',
    '80123456789012',
    'https://seu-projeto.supabase.co/storage/v1/object/public/produtos/monitor-multiparametros.jpg'
);

-- Exemplo 2: Instrumentação Cirúrgica CME
INSERT INTO public.produtos (
    categoria,
    nome,
    slug,
    descricao_curta,
    aplicacao,
    descricao_tecnica,
    caracteristicas_beneficios,
    codigo_produto,
    imagem_url
) VALUES (
    'Instrumentação Cirúrgica CME',
    'Kit Instrumentação Cirurgia Geral',
    'kit-instrumentacao-cirurgia-geral',
    'Kit completo de instrumentação cirúrgica para cirurgias gerais, esterilizado e pronto para uso.',
    'Indicado para procedimentos cirúrgicos gerais de pequeno e médio porte em ambiente hospitalar.',
    'Kit contendo 45 peças de instrumentação cirúrgica em aço inoxidável cirúrgico grau médico, esterilizado em autoclave com rastreabilidade completa. Certificado de esterilização incluso.',
    'Instrumentais em aço inoxidável cirúrgico
Esterilização em autoclave rastreável
Certificado de esterilização
Embalagem dupla estéril
Kit completo para cirurgia geral
Processamento em CME certificado',
    'KIT-CG-001',
    'https://seu-projeto.supabase.co/storage/v1/object/public/produtos/kit-cirurgia-geral.jpg'
);

-- Exemplo 3: OPME
INSERT INTO public.produtos (
    categoria,
    nome,
    slug,
    descricao_curta,
    aplicacao,
    descricao_tecnica,
    caracteristicas_beneficios,
    codigo_produto,
    codigo_anvisa,
    imagem_url
) VALUES (
    'OPME',
    'Placa de Fixação Óssea Titânio 3.5mm',
    'placa-fixacao-ossea-titanio-35mm',
    'Placa de fixação óssea em titânio grau cirúrgico 3.5mm para fraturas de ossos longos.',
    'Indicada para fixação interna de fraturas de ossos longos, correções ortopédicas e procedimentos de osteossíntese.',
    'Placa de fixação óssea fabricada em titânio grau 5 (Ti-6Al-4V), espessura 3.5mm, com orifícios para parafusos corticais. Fornecida estéril em embalagem individual.',
    'Material: Titânio grau cirúrgico
Biocompatível e não-magnético
Alta resistência mecânica
Reduz risco de rejeição
Compatível com exames de ressonância magnética
Fornecida estéril
Rastreabilidade completa
Registro ANVISA válido',
    'OPME-TIT-35',
    '10987654321098',
    'https://seu-projeto.supabase.co/storage/v1/object/public/produtos/placa-titanio.jpg'
);

-- =====================================================
-- CONSULTAS ÚTEIS
-- =====================================================

-- Buscar todos os produtos de uma categoria
-- SELECT * FROM produtos WHERE categoria = 'Equipamentos Médicos' ORDER BY nome;

-- Buscar produto por slug
-- SELECT * FROM produtos WHERE slug = 'monitor-multiparametros-portatil';

-- Buscar categorias únicas
-- SELECT DISTINCT categoria FROM produtos ORDER BY categoria;

-- Contar produtos por categoria
-- SELECT categoria, COUNT(*) as total FROM produtos GROUP BY categoria;
