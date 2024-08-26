/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
		fontFamily: {
			quicksand: ["Quicksand", "sans-serif"],
			karla: ["Karla", "sans-serif"],
			evwn: ["Edu VIC WA NT Beginner", "cursive"],
		},
    extend: {
      colors: {
				background: "#18181b",		// (zinc-900)
				base: "#27272a",			    // (zinc-800)
				'base-2': "#3f3f46",			// (zinc-700)
				'base-3': "#52525b",      // (zinc-600)
				'base-4': "#71717a",      // (zinc-500)
				accent: "#0ea5e9",			  // for buttons, links and other highlighted elements (sky-500)
				txt: "#d1d5db",				    // gray-300
				"txt-depressed": "#9ca3af", // gray-400
				danger: "#ef4444",			// for delete functionalities
				"light-red": "#fca5a5",
				"light-green": "#86efac",
				"light-cyan": "#67e8f9"
			},
    },
  },
  plugins: [],
}