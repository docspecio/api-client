import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            all: true,
            exclude: configDefaults.exclude.concat(['bin/*', '**/*.spec.ts', '**/__test__/**']),
        },
        setupFiles: ['./vitest.setup.ts'],
    },
})
