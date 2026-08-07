import JsBarcode from 'jsbarcode'

export function renderBarcodeSvg(code, options = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, code, {
    format: 'CODE128',
    width: 2,
    height: 70,
    displayValue: true,
    fontSize: 14,
    margin: 8,
    ...options,
  })
  return svg
}

export function printBarcode(code, label) {
  const svg = renderBarcodeSvg(code)
  const printWindow = window.open('', '_blank', 'width=420,height=320')
  if (!printWindow) return

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${label ?? code}</title>
        <style>
          body { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 min-height: 100vh; margin: 0; font-family: sans-serif; gap: 8px; }
          p { margin: 0; font-size: 13px; text-align: center; max-width: 320px; }
        </style>
      </head>
      <body>
        ${label ? `<p>${label}</p>` : ''}
        ${svg.outerHTML}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
