const {override, fixBabelImports,addLessLoader} = require('customize-cra');
const paths = require('react-scripts/config/paths');
const path = require('path')

paths.appBuild=path.resolve(paths.appBuild,'../docs')

// process.env.GENERATE_SOURCEMAP = false;

module.exports = override(
    fixBabelImports('import', {
        libraryName: 'antd-mobile',
        libraryDirectory: 'es',
        style: true,
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: {
            "@brand-primary": "#000",
            "@brand-primary-tap": "#000",
            "@brand-success": "#6abf47",
            "@brand-warning": "#ffc600",
            "@brand-error": "#f4333c",
            "@brand-important": "#ff5b05",
            "@brand-wait": "#000",
        },
    }),
);

