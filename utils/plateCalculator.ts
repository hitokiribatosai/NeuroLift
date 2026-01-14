export interface PlateConfig {
    barWeight: number;
    availablePlates: number[]; // sorted descending
    unit: 'kg' | 'lbs';
}

export const DEFAULT_PLATE_CONFIGS: Record<'kg' | 'lbs', PlateConfig> = {
    kg: {
        barWeight: 20,
        availablePlates: [25, 20, 15, 10, 5, 2.5, 1.25],
        unit: 'kg'
    },
    lbs: {
        barWeight: 45,
        availablePlates: [45, 35, 25, 10, 5, 2.5],
        unit: 'lbs'
    }
};

export interface PlateSolution {
    platesPerSide: number[];
    totalWeight: number;
    message?: string;
}

export const calculatePlates = (
    targetWeight: number,
    config: PlateConfig
): PlateSolution => {
    const { barWeight, availablePlates } = config;

    // Weight to load on each side
    const weightPerSide = (targetWeight - barWeight) / 2;

    if (weightPerSide < 0) {
        return {
            platesPerSide: [],
            totalWeight: barWeight,
            message: 'Target weight is less than bar weight'
        };
    }

    if (weightPerSide === 0) {
        return {
            platesPerSide: [],
            totalWeight: barWeight,
            message: 'Empty bar'
        };
    }

    // Greedy algorithm: use largest plates first
    const platesPerSide: number[] = [];
    let remaining = weightPerSide;

    for (const plate of availablePlates) {
        while (remaining >= plate) {
            platesPerSide.push(plate);
            remaining -= plate;
        }
    }

    // Fix floating point issues for display
    const actualWeight = barWeight + (2 * platesPerSide.reduce((sum, p) => sum + p, 0));

    if (remaining > 0.1) {
        return {
            platesPerSide,
            totalWeight: actualWeight,
            message: `Closest match: ${actualWeight}${config.unit} (can't reach exact weight)`
        };
    }

    return {
        platesPerSide,
        totalWeight: actualWeight
    };
};
