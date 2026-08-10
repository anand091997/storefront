/********************************************************************
 *  Copyright 2025 Adobe
 *  All Rights Reserved.
 *
 * NOTICE:  Adobe permits you to use, modify, and distribute this
 * file in accordance with the terms of the Adobe license agreement
 * accompanying it.
 *******************************************************************/
export interface Meal {
    idMeal: string;
    strMeal: string;
    strMealAlternate: string | null;
    strCategory: string;
    strArea: string;
    strCountry?: string;
    strInstructions?: string;
    strMealThumb: string;
    strTags: string | null;
    strYoutube?: string;
    strSource?: string;
}
export interface MealSearchResponse {
    meals: Meal[] | null;
}
export declare const searchMeals: (query?: string) => Promise<MealSearchResponse>;
//# sourceMappingURL=meal.d.ts.map