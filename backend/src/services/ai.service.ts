import { geminiModel, geminiVisionModel } from '../config/gemini';
import prisma from '../config/database';

export class AIService {
    /**
     * Processa comandos de chat do usuário
     * Exemplos: "Adicionar gasto de R$50 no Nubank", "Quanto tenho disponível?"
     */
    async processChat(userId: string, message: string): Promise<any> {
        try {
            // Buscar contexto do usuário
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    accounts: true,
                    creditCards: true,
                    transactions: {
                        take: 10,
                        orderBy: { date: 'desc' }
                    },
                    loans: true
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Criar prompt contextualizado
            const context = this.buildUserContext(user);
            const prompt = `${context}\n\nUsuário: ${message}\n\nAnálise a mensagem e retorne um JSON com a ação a ser tomada. Possíveis ações:\n- "add_transaction": adicionar transação\n- "query_balance": consultar saldo\n- "query_status": consultar situação financeira\n- "advice": dar conselho financeiro\n\nFormato de resposta JSON:\n{\n  "action": "tipo_acao",\n  "data": { dados relevantes },\n  "response": "resposta amigável ao usuário"\n}`;

            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Tentar parsear JSON
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const aiResponse = JSON.parse(jsonMatch[0]);
                    return aiResponse;
                }
            } catch (e) {
                // Se não conseguir parsear, retornar resposta direta
                return {
                    action: 'advice',
                    response: text
                };
            }

            return {
                action: 'advice',
                response: text
            };
        } catch (error: any) {
            console.error('AI Chat Error:', error);
            throw new Error(`Erro ao processar chat: ${error.message}`);
        }
    }

    /**
     * Extrai dados de comprovante usando OCR
     */
    async processReceipt(imageBase64: string): Promise<any> {
        try {
            const prompt = `Analise este comprovante de pagamento e extraia as seguintes informações em formato JSON:
{
  "amount": valor numérico (apenas números, sem R$),
  "date": data no formato YYYY-MM-DD,
  "merchant": nome do estabelecimento/beneficiário,
  "description": descrição da transação,
  "category": categoria sugerida (ex: alimentação, transporte, saúde, etc),
  "paymentMethod": método de pagamento (cartão, pix, boleto, etc)
}

Se não conseguir identificar algum campo, use null.`;

            const imagePart = {
                inlineData: {
                    data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                    mimeType: 'image/jpeg'
                }
            };

            const result = await geminiVisionModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Extrair JSON da resposta
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const extractedData = JSON.parse(jsonMatch[0]);
                return extractedData;
            }

            throw new Error('Não foi possível extrair dados do comprovante');
        } catch (error: any) {
            console.error('OCR Error:', error);
            throw new Error(`Erro ao processar comprovante: ${error.message}`);
        }
    }

    /**
     * Analisa a saúde financeira e retorna cor e sugestões
     */
    async analyzeFinancialHealth(userId: string): Promise<any> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    accounts: true,
                    creditCards: true,
                    loans: true,
                    transactions: {
                        where: {
                            date: {
                                gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                            }
                        }
                    }
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Calcular métricas
            const totalIncome = user.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpenses = user.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalDebt = user.loans.reduce((sum, l) => sum + l.remainingAmount, 0) +
                user.creditCards.reduce((sum, c) => sum + c.currentBalance, 0);

            const debtRatio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 100;

            // Determinar cor e status
            let color = '';
            let status = '';
            let healthScore = 0;

            if (debtRatio > 70) {
                color = '#8B0000'; // Vermelho escuro
                status = 'critical';
                healthScore = 1;
            } else if (debtRatio > 50) {
                color = '#FF4500'; // Laranja
                status = 'concerning';
                healthScore = 2;
            } else if (debtRatio > 30) {
                color = '#FFD700'; // Amarelo
                status = 'attention';
                healthScore = 3;
            } else if (debtRatio > 10) {
                color = '#90EE90'; // Verde claro
                status = 'controlled';
                healthScore = 4;
            } else if (debtRatio > 0) {
                color = '#228B22'; // Verde forte
                status = 'healthy';
                healthScore = 5;
            } else {
                const savingsRatio = ((totalIncome - totalExpenses) / totalIncome) * 100;
                if (savingsRatio > 20) {
                    color = '#0000CD'; // Azul forte
                    status = 'excellent';
                    healthScore = 7;
                } else if (savingsRatio > 10) {
                    color = '#87CEEB'; // Azul claro
                    status = 'saving';
                    healthScore = 6;
                } else {
                    color = '#228B22'; // Verde forte
                    status = 'healthy';
                    healthScore = 5;
                }
            }

            // Gerar sugestões com IA (ou usar padrão se IA não configurada)
            let suggestions: string[] = [];

            if (geminiModel) {
                try {
                    const context = `Situação financeira:
- Renda mensal: R$ ${totalIncome.toFixed(2)}
- Despesas mensais: R$ ${totalExpenses.toFixed(2)}
- Dívidas totais: R$ ${totalDebt.toFixed(2)}
- Proporção de dívidas: ${debtRatio.toFixed(1)}%
- Status: ${status}

Forneça 3 sugestões práticas e específicas para melhorar a saúde financeira.`;

                    const result = await geminiModel.generateContent(context);
                    const suggestionsText = await result.response.text();
                    suggestions = suggestionsText.split('\n').filter(s => s.trim().length > 0);
                } catch (error) {
                    console.warn('Could not generate AI suggestions, using defaults');
                    suggestions = this.getDefaultSuggestions(status, debtRatio);
                }
            } else {
                suggestions = this.getDefaultSuggestions(status, debtRatio);
            }

            return {
                color,
                status,
                healthScore,
                debtRatio: debtRatio.toFixed(1),
                totalIncome,
                totalExpenses,
                totalDebt,
                suggestions
            };
        } catch (error: any) {
            console.error('Financial Health Analysis Error:', error);
            throw new Error(`Erro ao analisar saúde financeira: ${error.message}`);
        }
    }

    /**
     * Retorna sugestões padrão baseadas no status financeiro
     */
    private getDefaultSuggestions(status: string, debtRatio: number): string[] {
        const suggestions: { [key: string]: string[] } = {
            critical: [
                'Considere renegociar suas dívidas com taxas de juros menores',
                'Priorize o pagamento das dívidas com maiores juros primeiro',
                'Busque fontes de renda extra para acelerar o pagamento das dívidas'
            ],
            concerning: [
                'Estabeleça um orçamento mensal rigoroso para controlar gastos',
                'Evite novas dívidas até reduzir o comprometimento atual',
                'Considere vender itens que não usa para quitar dívidas'
            ],
            attention: [
                'Mantenha o controle dos gastos e evite compras desnecessárias',
                'Crie uma reserva de emergência equivalente a 3 meses de despesas',
                'Revise assinaturas e serviços que podem ser cancelados'
            ],
            controlled: [
                'Continue controlando seus gastos mensalmente',
                'Aumente sua reserva de emergência para 6 meses',
                'Considere investir em sua educação financeira'
            ],
            healthy: [
                'Comece a investir para fazer seu dinheiro crescer',
                'Mantenha sua disciplina financeira',
                'Estabeleça metas financeiras de longo prazo'
            ],
            saving: [
                'Diversifique seus investimentos',
                'Continue economizando e investindo regularmente',
                'Considere investimentos de médio e longo prazo'
            ],
            excellent: [
                'Você está indo muito bem! Continue assim',
                'Considere investimentos mais agressivos para maximizar retornos',
                'Ajude outras pessoas compartilhando seu conhecimento financeiro'
            ]
        };

        return suggestions[status] || suggestions['healthy'];
    }

    /**
     * Constrói contexto do usuário para a IA
     */
    private buildUserContext(user: any): string {
        const totalBalance = user.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
        const totalCreditUsed = user.creditCards.reduce((sum: number, card: any) => sum + card.currentBalance, 0);
        const totalCreditLimit = user.creditCards.reduce((sum: number, card: any) => sum + card.limit, 0);
        const totalLoans = user.loans.reduce((sum: number, loan: any) => sum + loan.remainingAmount, 0);

        return `Contexto do usuário ${user.name}:
- Saldo total em contas: R$ ${totalBalance.toFixed(2)}
- Cartões de crédito: ${user.creditCards.length} cartão(ões)
- Limite total: R$ ${totalCreditLimit.toFixed(2)}
- Usado: R$ ${totalCreditUsed.toFixed(2)}
- Empréstimos: R$ ${totalLoans.toFixed(2)}
- Últimas transações: ${user.transactions.map((t: any) => `${t.description}: R$ ${t.amount}`).join(', ')}`;
    }
}

export default new AIService();
