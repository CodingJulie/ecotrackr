self.onmessage = function (e) {
    const {
        usersData,
        limit,
        defaultUserName = 'User',
    } = e.data;

    if (!usersData || usersData.length === 0) {
        self.postMessage({ leaderboard: [] });
        return;
    }

    const userStats = new Map();

    for (const entry of usersData) {
        const userId = entry.user_id;
        if (!userStats.has(userId)) {
            userStats.set(userId, {
                id: userId,
                name: entry.user_name || defaultUserName,
                avatar_url: entry.avatar_url,
                totalCO2: 0,
                entriesCount: 0,
                categories: new Set(),
            });
        }

        const stats = userStats.get(userId);
        stats.totalCO2 += entry.co2e || 0;
        stats.entriesCount++;
        if (entry.category) {
            stats.categories.add(entry.category);
        }
    }

    let leaderboard = Array.from(userStats.values()).map((user) => ({
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        totalCO2: user.totalCO2,
        entriesCount: user.entriesCount,
        categoriesCount: user.categories.size,
        avgCO2: user.entriesCount ? Math.round(user.totalCO2 / user.entriesCount) : 0,
    }));

    leaderboard.sort((a, b) => b.totalCO2 - a.totalCO2);

    const medals = ['🥇', '🥈', '🥉'];
    leaderboard = leaderboard.slice(0, limit || 100).map((user, index) => {
        const rank = index + 1;
        return {
            ...user,
            rank,
            medal: rank <= 3 ? medals[rank - 1] : null,
        };
    });

    self.postMessage({ leaderboard });
};
