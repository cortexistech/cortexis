# Cortexis Tech

## Português do Brasil e de Portugal

O site é escrito em português do Brasil, nos arquivos da raiz. Quem acessa de
Portugal recebe a versão em português de Portugal, que fica em
`localized-files/ALL_pt/` e é servida pelo Firebase Hosting conforme o país do
visitante (`i18n` no `firebase.json`).

Essa versão é gerada pelo script `scripts/gerar-pt-pt.py`, que troca vocabulário,
ortografia e construções (contacto, ecrã, telemóvel, utilizador, "A sua
operação", "a funcionar" etc.) sem mexer em links, e-mails e nomes de arquivo.

- Depois de mudar qualquer texto, rode `python3 scripts/gerar-pt-pt.py` e confira
  o resultado. O deploy no GitHub Actions também roda o script antes de publicar.
- Se uma frase nova sair estranha em pt-PT, acrescente a regra em `PHRASES`
  no script (as frases mais específicas vêm primeiro).
- O seletor "Brasil / Portugal" no rodapé grava o cookie
  `firebase-country-override`, que o Firebase usa para trocar de versão.
