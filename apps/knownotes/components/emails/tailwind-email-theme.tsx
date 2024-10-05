export const tailwindEmailConfig = {
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "215 20.2% 65.1%",
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        primary: {
          DEFAULT: "222.2 47.4% 11.2%",
          foreground: "210 40% 98%",
        },
        secondary: {
          DEFAULT: "210 40% 96.1%",
          foreground: "222.2 47.4% 11.2%",
        },
        destructive: {
          DEFAULT: "0 84.2% 60.2%",
          foreground: "210 40% 98%",
        },
        muted: {
          DEFAULT: "210 40% 96.1%",
          foreground: "215.4 16.3% 46.9%",
        },
        accent: {
          DEFAULT: "217.2 32.6% 17.5%",
          foreground: "",
        },
        popover: {
          DEFAULT: "222.2 84% 4.9%",
          foreground: "210 40% 98%",
        },
        card: {
          DEFAULT: "222.2 84% 4.9%",
          foreground: "210 40% 98%",
        },
      },
      borderRadius: {
        lg: `0.5rem`,
        md: `calc(0.5rem - 2px)`,
        sm: "calc(0.5rem - 4px)",
      },
      // fontFamily: {
      //   sans: ["var(--font-sans)", ...fontFamily.sans],
      //   heading: ["var(--font-bold)", ...fontFamily.sans],
      // },
    },
  },
}
