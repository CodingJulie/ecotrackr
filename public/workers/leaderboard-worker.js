// Расчёт лидерборда
self.onmessage = function(e) {
    const { usersData, sortBy, limit } = e.data;

    if (!usersData || usersData.length === 0) {
        self.postMessage({ leaderboard: [] });
        return;
    }

    // Агрегация данных по пользователям
    const userStats = new Map();

    for (const entry of usersData) {
        const userId = entry.user_id;
        if (!userStats.has(userId)) {
            userStats.set(userId, {
                id: userId,
                name: entry.user_name || 'Пользователь',
                avatar_url: entry.avatar_url,
                totalCO2: 0,
                entriesCount: 0,
                categories: new Set()
            });
        }

        const stats = userStats.get(userId);
        stats.totalCO2 += entry.co2e || 0;
        stats.entriesCount++;
        stats.categories.add(entry.category);
    }

    // Преобразование в массив
    let leaderboard = Array.from(userStats.values()).map(user => ({
        ...user,
        categoriesCount: user.categories.size,
        avgCO2: user.entriesCount ? Math.round(user.totalCO2 / user.entriesCount) : 0,
        rank: 0
    }));

    // Сортировка
    if (sortBy === 'co2') {
        leaderboard.sort((a, b) => a.totalCO2 - b.totalCO2);
    } else if (sortBy === 'entries') {
        leaderboard.sort((a, b) => b.entriesCount - a.entriesCount);
    } else if (sortBy === 'avg') {
        leaderboard.sort((a, b) => a.avgCO2 - b.avgCO2);
    } else if (sortBy === 'categories') {
        leaderboard.sort((a, b) => b.categoriesCount - a.categoriesCount);
    }

    // Добавляем rank и обрезаем
    leaderboard = leaderboard.slice(0, limit || 100).map((user, index) => ({
        ...user,
        rank: index + 1
    }));

    // Добавляем медали
    const medals = ['🥇', '🥈', '🥉'];
    leaderboard = leaderboard.map(user => ({
        ...user,
        medal: user.rank <= 3 ? medals[user.rank - 1] : null
    }));

    self.postMessage({ leaderboard });
};