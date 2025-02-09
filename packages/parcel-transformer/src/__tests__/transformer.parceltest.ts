import { join } from 'path';

import Parcel, { createWorkerFarm } from '@parcel/core';
import { MemoryFS } from '@parcel/fs';

const rootPath = join(__dirname, '..', '..', '..', '..');
const fixtureRoot = join(rootPath, 'fixtures/parcel-transformer-test-app');
const extractionFixtureRoot = join(rootPath, 'fixtures/parcel-transformer-test-extract-app');
const customResolverFixtureRoot = join(
  rootPath,
  'fixtures/parcel-transformer-test-custom-resolver-app'
);
const babelComponentFixture = join(rootPath, 'fixtures/babel-component');

const workerFarm = createWorkerFarm();

afterAll(() => {
  workerFarm.end();
});

const getParcelInstance = (workingDir: string) => {
  const outputFS = new MemoryFS(workerFarm);
  return new Parcel({
    config: join(workingDir, '.parcelrc'),
    entries: [join(workingDir, 'src', 'index.html')],
    outputFS,
    targets: {
      default: {
        distDir: join(workingDir, 'dist'),
      },
    },
    workerFarm,
  });
};

it('transforms assets with babel plugin', async () => {
  const parcel = getParcelInstance(fixtureRoot);
  const { changedAssets } = await parcel.run();

  const asset = Array.from(changedAssets.values()).find(
    (asset) => asset.filePath === join(fixtureRoot, 'src/index.jsx')
  );

  const code = await asset?.getCode();
  const appCode = code?.slice(
    code.indexOf('/* index.jsx generated by @compiled/babel-plugin v0.0.0 */')
  );
  expect(appCode).toMatchInlineSnapshot(`
    "/* index.jsx generated by @compiled/babel-plugin v0.0.0 */ var _2 = \\"._syaz5scu{color:red}\\";
    var _ = \\"._1wyb12am{font-size:50px}\\";
    var App = function() {
        /*#__PURE__*/ return (0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
            children: /*#__PURE__*/ (0, _jsxRuntime.jsxs)(_runtime.CC, {
                children: [
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(_runtime.CS, {
                        children: [
                            _,
                            _2
                        ]
                    }),
                    /*#__PURE__*/ (0, _jsxRuntime.jsx)(\\"div\\", {
                        className: (0, _runtime.ax)([
                            \\"_1wyb12am _syaz5scu\\"
                        ]),
                        children: \\"hello from parcel\\"
                    })
                ]
            })
        });
    };
    "
  `);
}, 50000);

it('transforms assets with custom resolver and statically evaluates imports', async () => {
  const parcel = getParcelInstance(customResolverFixtureRoot);
  const { changedAssets } = await parcel.run();

  const asset = Array.from(changedAssets.values()).find(
    (asset) => asset.filePath === join(customResolverFixtureRoot, 'src/index.jsx')
  );

  const code = await asset?.getCode();

  expect(code).toInclude('color:red');
}, 50000);

it('transforms assets with compiled and extraction babel plugins', async () => {
  const parcel = getParcelInstance(extractionFixtureRoot);
  const { changedAssets } = await parcel.run();
  const assets = Array.from(changedAssets.values());

  const indexJsCode = await assets
    .find((asset) => asset.filePath === join(extractionFixtureRoot, 'src/index.jsx'))
    ?.getCode();
  expect(indexJsCode).toMatchInlineSnapshot(`
    "var parcelHelpers = require(\\"@parcel/transformer-js/src/esmodule-helpers.js\\");
    var _jsxDevRuntime = require(\\"react/jsx-dev-runtime\\");
    var _runtime = require(\\"@compiled/react/runtime\\");
    var _babelComponentFixture = require(\\"@compiled/babel-component-fixture\\");
    var _babelComponentFixtureDefault = parcelHelpers.interopDefault(_babelComponentFixture);
    var _this = undefined;
    /* index.jsx generated by @compiled/babel-plugin v0.0.0 */ require(\\"compiled-css!?style=._syaz5scu%7Bcolor%3Ared%7D\\");
    require(\\"compiled-css!?style=._1wyb12am%7Bfont-size%3A50px%7D\\");
    var App = function() {
        /*#__PURE__*/ return _jsxDevRuntime.jsxDEV(_jsxDevRuntime.Fragment, {
            children: [
                /*#__PURE__*/ _jsxDevRuntime.jsxDEV(\\"div\\", {
                    className: _runtime.ax([
                        \\"_1wyb12am _syaz5scu\\"
                    ]),
                    children: \\"CSS prop\\"
                }, void 0, false, {
                    fileName: \\"src/index.jsx\\",
                    lineNumber: 11,
                    columnNumber: 5
                }, _this),
                /*#__PURE__*/ _jsxDevRuntime.jsxDEV(_babelComponentFixtureDefault.default, {
                    children: \\"Babel component\\"
                }, void 0, false, {
                    fileName: \\"src/index.jsx\\",
                    lineNumber: 12,
                    columnNumber: 5
                }, _this)
            ]
        }, void 0, true);
    };
    "
  `);

  const babelComponentCode = await assets
    .find((asset) => asset.filePath === join(babelComponentFixture, 'dist/index.js'))
    ?.getCode();

  const extractedCss = babelComponentCode
    ?.slice(0, babelComponentCode.indexOf('exports.default = BabelComponent;'))
    .trim();
  expect(extractedCss).toMatchInlineSnapshot(`
    "/* index.jsx generated by @compiled/babel-plugin v0.0.0 */ \\"use strict\\";
    require(\\"compiled-css!?style=._19pk1ul9%7Bmargin-top%3A30px%7D\\");
    require(\\"compiled-css!?style=._19bv1vi7%7Bpadding-left%3A32px%7D\\");
    require(\\"compiled-css!?style=._n3td1vi7%7Bpadding-bottom%3A32px%7D\\");
    require(\\"compiled-css!?style=._u5f31vi7%7Bpadding-right%3A32px%7D\\");
    require(\\"compiled-css!?style=._ca0q1vi7%7Bpadding-top%3A32px%7D\\");
    require(\\"compiled-css!?style=._19itlf8h%7Bborder%3A2px%20solid%20blue%7D\\");
    require(\\"compiled-css!?style=._1wyb1ul9%7Bfont-size%3A30px%7D\\");
    require(\\"compiled-css!?style=._syaz13q2%7Bcolor%3Ablue%7D\\");
    Object.defineProperty(exports, \\"__esModule\\", {
        value: true
    });"
  `);

  const extractedComponent = babelComponentCode
    ?.slice(babelComponentCode.indexOf('var Button'))
    .trim();
  expect(extractedComponent).toMatchInlineSnapshot(`
    "var Button = (0, _react.forwardRef)(function(_ref, __cmplr) {
        var _ref$as = _ref.as, C = _ref$as === void 0 ? \\"button\\" : _ref$as, __cmpls = _ref.style, __cmplp = _objectWithoutProperties(_ref, _excluded);
        return (0, _jsxRuntime.jsx)(C, _objectSpread(_objectSpread({
        }, __cmplp), {
        }, {
            style: __cmpls,
            ref: __cmplr,
            className: (0, _runtime.ax)([
                \\"_syaz13q2 _1wyb1ul9 _19itlf8h _ca0q1vi7 _u5f31vi7 _n3td1vi7 _19bv1vi7\\",
                __cmplp.className
            ])
        }));
    });
    Button.displayName = 'Button';
    function BabelComponent(_ref2) {
        var children = _ref2.children;
        return (0, _jsxRuntime.jsx)(\\"div\\", {
            className: (0, _runtime.ax)([
                \\"_19pk1ul9\\"
            ]),
            children: /*#__PURE__*/ (0, _jsxRuntime.jsx)(Button, {
                children: children
            })
        });
    }"
  `);
}, 50000);
