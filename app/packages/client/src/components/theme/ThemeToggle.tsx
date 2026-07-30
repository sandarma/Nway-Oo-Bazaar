import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
   const { theme, toggle } = useTheme();

   return (
      <button
         onClick={toggle}
         aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
         className="relative flex h-9 w-9 items-center justify-center rounded-full glass-subtle text-muted-foreground transition-all duration-300 hover:text-foreground hover:scale-110"
      >
         <Sun
            className={`absolute h-[1.15rem] w-[1.15rem] transition-all duration-300 ${
               theme === 'dark'
                  ? 'rotate-0 scale-100 opacity-100'
                  : 'rotate-90 scale-0 opacity-0'
            }`}
         />
         <Moon
            className={`absolute h-[1.15rem] w-[1.15rem] transition-all duration-300 ${
               theme === 'light'
                  ? 'rotate-0 scale-100 opacity-100'
                  : '-rotate-90 scale-0 opacity-0'
            }`}
         />
      </button>
   );
}
