# Cortexis Tech — site institucional

Site da Cortexis Tech: serviços, produtos e contato. HTML, CSS e JavaScript
puros, sem etapa de build, hospedado no **Firebase Hosting** (projeto
`cortexis-site-18a82`, alvo `cortexistech`).

## Páginas

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Página inicial |
| `sobre.html`, `processo.html`, `contato.html` | Empresa, forma de trabalho e contato |
| `servicos.html`, `sites-landing-pages.html`, `aplicativos-mobile.html`, `agentes-ia.html`, `manutencao-suporte.html` | Serviços |
| `produtos-mvps.html`, `cortexis-ops.html`, `financas-facil.html` | Produtos |
| `apresentacao.html` | Apresentação comercial |

Estilos em `css/style.css`, comportamento em `js/script.js`, imagens em `img/` e `assets/`.

## Rodar localmente

Qualquer servidor estático serve:

```bash
npx serve .
# ou: python3 -m http.server 8080
```

## Publicação

Feita pelo GitHub Actions, sem passo manual:

- **Pull request** → publica uma prévia num canal temporário do Firebase e comenta o link no PR.
- **Merge na `main`** → publica no canal `live` (produção).

Para publicar manualmente: `firebase deploy --only hosting:cortexistech`.

Ao criar ou renomear uma página, atualize também `sitemap.xml`.
