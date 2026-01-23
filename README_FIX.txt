Aplicar correção (logo) + mini-gráfico radial (meter dial)

1) Substitua os arquivos:
- js/app.js  (cole o arquivo completo deste pacote)
- js/ui.js   (cole o arquivo completo deste pacote)

2) Cole o conteúdo de styles/part3_add.css NO FINAL do seu styles/app.css.
   (É o jeito mais seguro: não regrede seu CSS atual e não quebra nada.)

Por que o logo quebrou?
- Em hospedagens (GitHub Pages/Vercel) um caminho ou nome pode mudar (case sensitive).
- Agora existe fallback: se ./assets/logo.png falhar, aparece "VG" premium no lugar (sem ícone quebrado).
