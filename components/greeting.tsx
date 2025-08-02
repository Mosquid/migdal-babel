import { motion } from 'framer-motion';
import { LanguagePreferencesPanel } from './language-preferences-panel';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          De-Babel
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-2">
          Break language barriers with AI-powered translation
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Search and research in any language, get results in your native tongue
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md"
      >
        <LanguagePreferencesPanel variant="default" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="text-center mt-8 text-zinc-500 dark:text-zinc-400"
      >
        <p className="text-sm">
          Choose your languages above, then start chatting below
        </p>
      </motion.div>
    </div>
  );
};
