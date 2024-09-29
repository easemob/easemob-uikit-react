const config = {
    presets: [
        [
            '@babel/env',
            {
                corejs: 3,
                modules: false,
                useBuiltIns: 'usage'
            }
        ],
        '@babel/react'
    ]
}

export default config;