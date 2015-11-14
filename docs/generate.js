#!/usr/bin/env babel-node

import fs from 'fs';
import path from 'path';

let ignoreList = [
    'primarybutton',
    'successbutton',
    'warningbutton',
    'dangerbutton'
]

function generateModule(json, file) {
    return `/* eslint-disable */
exports.${ file } = ${ json }
/* eslint-enable */`;
}

function buildDocs(raw) {
    let expor = {};
    let api = JSON.parse(raw);

    for (let filepath in api) {
        let file = path.parse(filepath);

        if (ignoreList.indexOf(file.name) == -1) {
            let component = file.dir.match(/([^\/]*)\/*$/)[1];

            if (!expor[component]) expor[component] = [];
            expor[component].push(generateModule(JSON.stringify(api[filepath], null, 4), file.name));
        }
    }

    fs.openSync('./docs/components/exports.es6', 'w');

    Object.keys(expor).forEach(component => {
        let file = expor[component].join('\n');

        fs.writeFileSync('./docs/components/' + component + '/props.js', file);
        fs.appendFileSync('./docs/components/exports.es6', `import ${component} from './${component}/componentdoc';` + '\n');
        fs.createReadStream('./docs/componentdoc.jsx').pipe(fs.createWriteStream('./docs/components/' + component + '/componentdoc.jsx'));
    });

    Object.keys(expor).forEach(component => {
        fs.appendFileSync('./docs/components/exports.es6', '\n' + `exports.${component} = ${component};`);
    });

}

let json = '';

process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
    let chunk = process.stdin.read();
    if (chunk !== null) {
        json += chunk;
    }
});

process.stdin.on('end', function() {
    buildDocs(json);
})
