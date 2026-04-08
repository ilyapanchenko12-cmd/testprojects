/** Демо-метрики под роль (позже замените на данные из БД / отчётов бота). */
export function buildDemoKpis(role, filterCtx = {}) {
    const base = {
        period: filterCtx.periodLabel || 'today',
        project: filterCtx.projectName || 'все',
        buyer: filterCtx.buyerName,
        processor: filterCtx.processorName
    };
    if (role === 'BUYING') {
        return {
            ...base,
            spend: 4820,
            spendPlan: 5000,
            chats: 1240,
            pdp: 892,
            fd: 156,
            rd: 89,
            sub2dia: 0.684,
            dia2fd: 0.126,
            fd2rd: 0.571
        };
    }
    if (role === 'PROCESSING') {
        return {
            ...base,
            revenue: 28400,
            cashPlanPct: 0.94,
            pdp: 612,
            dialogs: 3410,
            deposits: 198,
            rd: 76,
            paymentsCount: 412
        };
    }
    if (role === 'ADMIN') {
        return {
            ...base,
            /** Главный срез (дублируются отчётами из канала). */
            spend: 4820,
            revenue: 28400,
            fd: 156,
            fdSum: 10800,
            revenueMonth: 124800,
            costs: 62100,
            payroll: 28400,
            netProfit: 34300,
            roi: 1.82,
            ltv: 186,
            ltvDays: 74
        };
    }
    if (role === 'CONTENT') {
        return {
            ...base,
            sub2dia: 0.648,
            ctrButtons: 0.039,
            buttonClicks: 12400,
            pdp: 5020,
            unsubRate: 0.041
        };
    }
    return base;
}
