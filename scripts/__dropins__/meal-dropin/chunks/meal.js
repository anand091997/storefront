/*! Copyright 2026 Adobe
All Rights Reserved. */
const n="https://www.themealdb.com/api/json/v1/1/search.php",r=t=>{const e=t.trim();return e?e.length===1?`${n}?f=${encodeURIComponent(e)}`:`${n}?s=${encodeURIComponent(e)}`:`${n}?f=a`},s=async(t="a")=>{const e=await fetch(r(t));if(!e.ok)throw new Error(`Meal API request failed: ${e.status}`);return e.json()};export{s};
//# sourceMappingURL=meal.js.map
