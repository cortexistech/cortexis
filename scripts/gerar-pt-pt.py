#!/usr/bin/env python3
"""
Gera a versão em português de Portugal do site.

O site é escrito em português do Brasil, na raiz. Este script lê cada página
(e os scripts com texto) e grava a versão pt-PT em localized-files/ALL_pt/.
O Firebase Hosting (i18n rewrites, ver firebase.json) serve essa pasta a quem
acede a partir de Portugal; os restantes visitantes recebem a versão da raiz.

Uso:  python3 scripts/gerar-pt-pt.py
Rode depois de mudar qualquer texto. O deploy no GitHub Actions também roda.

Só o texto visível muda: e-mails, links, nomes de arquivos, classes e ids
ficam protegidos. As regras vão da mais específica para a mais geral.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "localized-files", "ALL_pt")
JS_FILES = ["js/home.js", "js/script.js"]

# ---------------------------------------------------------------------------
# 1. Frases inteiras (espaços casam com qualquer quebra de linha)
# ---------------------------------------------------------------------------
PHRASES = [
    # frases que precisam vir antes das regras mais gerais
    ("no banco de dados", "na base de dados"),
    ("sob medida para o seu negócio", "à medida do seu negócio"),
    ("Aplicativos nativos e híbridos", "Aplicações nativas e híbridas"),
    # "a gente", "você" e frases que precisam de reescrita
    ("Peça uma demonstração de um produto ou conte o que você precisa. A gente responde o mais rápido possível.",
     "Peça uma demonstração de um produto ou conte-nos o que precisa. Respondemos o mais depressa possível."),
    ("Conte o processo que hoje custa tempo. A gente vê se um agente resolve.",
     "Conte o processo que hoje lhe custa tempo. Avaliamos se um agente o resolve."),
    ("A gente mostra o Cortexis Ops com a sede, as filiais e os módulos que fazem sentido para vocês.",
     "Mostramos o Cortexis Ops com a sede, as filiais e os módulos que fazem sentido para a sua empresa."),
    ("A gente mostra o TechClínica com os seus serviços, profissionais e unidades.",
     "Mostramos o TechClínica com os seus serviços, profissionais e unidades."),
    ("Tem uma ideia? A gente transforma em um produto funcional para validar com usuários reais, rápido.",
     "Tem uma ideia? Transformamo-la num produto funcional para validar com utilizadores reais, com rapidez."),
    ("Um MVP existe para testar com gente de verdade, não para parecer pronto.",
     "Um MVP existe para testar com pessoas reais, não para parecer pronto."),
    ("A gente ajuda a encontrar o próximo passo.", "Ajudamos a encontrar o próximo passo."),
    ("A gente cuida de atualizações, correções e melhorias contínuas.",
     "Tratamos das atualizações, correções e melhorias contínuas."),
    ("A gente responde se faz sentido", "Respondemos se faz sentido"),
    ("Conte o contexto e o que precisa ser resolvido. A gente combina os próximos passos.",
     "Conte o contexto e o que precisa de ser resolvido. Combinamos os próximos passos."),
    ("Se algo não faz sentido para o seu negócio, a gente avisa.",
     "Se algo não faz sentido para o seu negócio, avisamos."),
    ("com a gente ou com outra equipe", "connosco ou com outra equipa"),
    ("O que acontece com os seus dados quando você visita este site ou fala com a gente.",
     "O que acontece com os seus dados quando visita este site ou fala connosco."),
    ("Mensagem enviada! A gente responde em breve.", "Mensagem enviada! Respondemos em breve."),
    ("Enviando mensagem...", "A enviar mensagem..."),
    ("Fale com a gente", "Fale connosco"),
    ("O que você procura", "O que procura"),
    ("Usamos seus dados só para responder ao contato.", "Usamos os seus dados só para responder ao seu contacto."),
    ("Nenhum destes é o que você procura?", "Nenhum destes é o que procura?"),
    ("Você continua falando com quem conhece o projeto.", "Continua a falar com quem conhece o projeto."),
    ("mantendo você a par do que muda", "mantendo-o a par do que muda"),
    ("O que você pode esperar de nós.", "O que pode esperar de nós."),
    ("Você fala com quem desenha e constrói o projeto. Sem intermediários e sem telefone sem fio entre o pedido e o código.",
     "Fala com quem desenha e constrói o projeto. Sem intermediários nem telefone estragado entre o pedido e o código."),
    ("Só coletamos o que você envia no formulário de contato", "Só recolhemos o que nos envia no formulário de contacto"),
    ("Se você nos escrever por e-mail", "Se nos escrever por e-mail"),
    ("O que coletamos", "O que recolhemos"),
    ("Quem cuida dos dados", "Quem trata os dados"),
    ("Você pode pedir a exclusão a qualquer momento, salvo quando a lei exigir que algum registro seja mantido.",
     "Pode pedir a eliminação a qualquer momento, salvo quando a lei exigir que algum registo seja mantido."),
    ("Você pode pedir acesso, correção ou exclusão dos seus dados, e também perguntar como eles são usados.",
     "Pode pedir o acesso, a retificação ou o apagamento dos seus dados, e também perguntar como são usados."),
    ("Se preferir, você também pode procurar a autoridade", "Se preferir, pode também contactar a autoridade"),
    ("quando você a escolhe no rodapé", "quando a escolhe no rodapé"),
    ("com conversão pela cotação que você define", "com conversão pela cotação que definir"),
    ("Tudo o que um controle financeiro sério precisa.", "Tudo aquilo de que um controlo financeiro sério precisa."),
    ("para o seu site ou app não ficar parado no tempo", "para que o seu site ou a sua app não fiquem parados no tempo"),
    ("um estúdio enxuto de tecnologia", "um pequeno estúdio de tecnologia"),
    ("evoluir junto com o seu negócio", "evoluir com o seu negócio"),
    # gerúndios
    ("com o paciente virtual respondendo perguntas", "com o paciente virtual a responder a perguntas"),
    ("mostrando o pipeline", "a mostrar o pipeline"),
    ("o paciente confirmando a consulta pelo e-mail", "o paciente a confirmar a consulta por e-mail"),
    ("o paciente confirmando pelo e-mail", "o paciente a confirmar por e-mail"),
    ("cada um vendo só o que lhe cabe", "cada um a ver só o que lhe cabe"),
    ("aviso de item vencendo e de estoque abaixo do mínimo", "aviso de artigo a vencer e de stock abaixo do mínimo"),
    ("avisos de fatura vencendo", "avisos de fatura a vencer"),
    ("Continue rolando", "Continue a deslizar"),
    ("funcionando", "a funcionar"),
    ("Aguardando", "A aguardar"),
    ("aguardando", "a aguardar"),
    ("compartilhando", "partilhando"),
    ("em andamento", "em curso"),
    # aplicativo / app
    ("Verificação por aplicativo autenticador", "Verificação por aplicação de autenticação"),
    ("Por aplicativo autenticador", "Por aplicação de autenticação"),
    ("Aplicativos Mobile e Desktop", "Aplicações Mobile e Desktop"),
    ("Aplicativo mobile e desktop", "Aplicação mobile e desktop"),
    ("Quer um aplicativo assim", "Quer uma aplicação assim"),
    ("do aplicativo", "da aplicação"),
    ("um aplicativo", "uma aplicação"),
    ("o aplicativo", "a aplicação"),
    ("Aplicativos", "Aplicações"),
    ("aplicativos", "aplicações"),
    ("Aplicativo", "Aplicação"),
    ("aplicativo", "aplicação"),
    ("O app não acessa a internet", "A app não acede à internet"),
    ("o app não tem servidor", "a app não tem servidor"),
    ("o app oferece restaurar", "a app propõe restaurar"),
    ("é o app Android", "é a app Android"),
    ("Conhecer o app", "Conhecer a app"),
    ("Falar do app", "Falar da app"),
    ("Tela inicial do app", "Ecrã inicial da app"),
    ("Gerenciador de senhas", "Gestor de palavras-passe"),
    # telas
    ("Ver as telas", "Ver os ecrãs"),
    ("As telas", "Os ecrãs"),
    ("as telas", "os ecrãs"),
    ("na mesma tela", "no mesmo ecrã"),
    ("não só na tela", "não só no ecrã"),
    ("restauração pela própria tela", "restauro no próprio ecrã"),
    ("widget na tela inicial", "widget no ecrã inicial"),
    ("acessibilidade testada com fonte em 200%", "acessibilidade testada com tipo de letra a 200%"),
    ("Tela ", "Ecrã "),
    # arquivo = ficheiro (o arquivo físico continua "arquivo")
    ("Arquivos com impressão digital", "Ficheiros com impressão digital"),
    ("Cada arquivo recebe", "Cada ficheiro recebe"),
    ("qualquer arquivo trocado", "qualquer ficheiro trocado"),
    ("abrir um arquivo", "abrir um ficheiro"),
    ("Arquivos OFX e CSV", "Ficheiros OFX e CSV"),
    # banco de dados
    ("Banco criptografado", "Base de dados encriptada"),
    ("banco criptografado", "base de dados encriptada"),
    ("Banco de dados", "Base de dados"),
    ("banco de dados", "base de dados"),
    # termos de gestão
    ("sem montar planilha", "sem montar folhas de cálculo"),
    ("sem planilha", "sem folhas de cálculo"),
    ("planilhas espalhadas", "folhas de cálculo espalhadas"),
    ("o histórico se atualiza", "o histórico atualiza-se"),
    ("depende de alguém lembrar", "depende de alguém se lembrar"),
    ("reais, rápido.", "reais, com rapidez."),
    ("1.240 un", "1240 un"),
    ("Acessar o sistema", "Aceder ao sistema"),
    ("sem precisar ligar", "sem precisar de telefonar"),
    ("sem ligação nem login", "sem telefonema nem login"),
    ("Do horário marcado ao dinheiro no caixa.", "Do horário marcado ao dinheiro em caixa."),
    ("baixa os materiais do estoque", "dá baixa dos materiais no stock"),
    ("baixados quando a consulta é concluída", "abatidos quando a consulta é concluída"),
    ("faltas e inadimplência", "faltas e pagamentos em atraso"),
    ("entradas com nota fiscal e fornecedor", "entradas com fatura e fornecedor"),
    ("livro de movimentação", "livro de movimentos"),
    ("cada movimentação fica registrada e não pode ser apagada", "cada movimento fica registado e não pode ser apagado"),
    ("Desativar um usuário corta o acesso na hora.", "Desativar um utilizador corta o acesso de imediato."),
    ("orçamentos e pedidos", "orçamentos e encomendas"),
    ("Orçamento e pedido", "Orçamento e encomenda"),
    ("o orçamento aceito vira pedido", "o orçamento aceite passa a encomenda"),
    ("pedido pela alçada e recebimento por nota", "encomenda pela alçada e receção por fatura"),
    ("custo e margem de cada nota", "custo e margem de cada fatura"),
    ("os serviços realizados viram a conta da consulta", "os serviços realizados passam a ser a conta da consulta"),
    ("viram custo da OS e conta a pagar", "passam a custo da OS e a conta a pagar"),
    ("a posição de hoje é ao vivo", "a posição de hoje é em tempo real"),
    ("Ao vivo", "Em direto"),
    ("compras parceladas", "compras a prestações"),
    ("nas próximas faturas", "pelas próximas faturas"),
    ("com o percentual gasto", "com a percentagem gasta"),
    ("percentual de cada profissional", "percentagem de cada profissional"),
    ("leitura do horímetro", "leitura do conta-horas"),
    ("fotos, laudos e assinatura", "fotos, relatórios técnicos e assinatura"),
    ("recusa com justificativa", "recusa com justificação"),
    ("das demais", "das restantes"),
    ("dos demais", "dos restantes"),
    ("junto a clientes", "junto de clientes"),
    ("metas com aportes", "metas com contribuições"),
    ("Agendar demonstração", "Marcar demonstração"),
    ("remarcação", "reagendamento"),
    ("de verdade", "a sério"),
    ("prontos para usar", "prontos a usar"),
    ("Sob medida", "À medida"),
    ("sob medida", "à medida"),
    ("Pular para o conteúdo", "Saltar para o conteúdo"),
    ("libera exame físico", "desbloqueia o exame físico"),
    ("Liberados só por comando explícito", "Desbloqueados só por comando explícito"),
    ("Código limpo e performático", "Código limpo e eficiente"),
    ("Transações com busca", "Transações com pesquisa"),
    ("filtros salvos", "filtros guardados"),
    ("salvar em PDF", "guardar em PDF"),
    ("quem cadastrou", "quem registou"),
    ("Sem cadastro", "Sem registo"),
    ("num cadastro único", "num registo único"),
    # dados ilustrativos dos painéis (js/home.js)
    ("Ticket médio", "Valor médio"),
    ("Giro médio (dias)", "Rotação média (dias)"),
    ("TechEstoque · Giro", "TechEstoque · Rotação"),
    ("Troca de óleo", "Mudança de óleo"),
    ("Pneus dianteiros", "Pneus da frente"),
    ("Freios", "Travões"),
    ("ASO equipe B", "Aptidão equipa B"),
    ("Contrato social", "Pacto social"),
]

# ---------------------------------------------------------------------------
# 2. Palavras soltas (com fronteira de palavra; a versão capitalizada é gerada)
# ---------------------------------------------------------------------------
WORDS = {
    "contato": "contacto", "contatos": "contactos",
    "celular": "telemóvel", "celulares": "telemóveis",
    "usuário": "utilizador", "usuários": "utilizadores",
    "registro": "registo", "registros": "registos",
    "registrar": "registar", "registram": "registam",
    "registrado": "registado", "registrada": "registada",
    "registrados": "registados", "registradas": "registadas",
    "equipe": "equipa", "equipes": "equipas",
    "estoque": "stock",
    "controle": "controlo",
    "senha": "palavra-passe", "senhas": "palavras-passe",
    "criptografado": "encriptado", "criptografada": "encriptada",
    "criptografados": "encriptados", "criptografadas": "encriptadas",
    "câmera": "câmara",
    "detecção": "deteção",
    "patrimônio": "património",
    "Amazônia": "Amazónia",
    "quilômetros": "quilómetros",
    "canadense": "canadiano",
    "recepção": "receção",
    "monitoramento": "monitorização",
    "compartilhar": "partilhar",
    "exclusão": "eliminação", "excluir": "eliminar",
    "fechamento": "fecho",
    "confiável": "fiável",
    "porcentagem": "percentagem",
    "parcelas": "prestações",
    "comprovantes": "comprovativos",
    "item": "artigo", "itens": "artigos",
}

POSSESSIVES = {"seu": "o", "sua": "a", "seus": "os", "suas": "as",
               "nosso": "o", "nossa": "a", "nossos": "os", "nossas": "as"}
HAS_ARTICLE = {"o", "a", "os", "as", "do", "da", "dos", "das", "no", "na", "nos", "nas",
               "ao", "à", "aos", "às", "pelo", "pela", "pelos", "pelas", "num", "numa",
               "dum", "duma", "um", "uma", "este", "esta", "esse", "essa", "aquele", "aquela",
               "só", "é", "são", "ser", "lhe"}

MASK = re.compile(
    r"[\w.+-]+@[\w-]+\.[\w.]+"                        # e-mails
    r"|https?://[^\s\"'<>)]+"                         # URLs
    r"|[\w./-]+\.(?:html|js|css|webp|jpe?g|png|svg|mp4|json)(?:\?[^\s\"'<>]*)?"  # arquivos
    r"|assunto=[\w-]+"
)


def _ci(phrase):
    """Regex de uma frase: espaços casam com qualquer espaço em branco."""
    return re.compile(r"(?<![\wÀ-ÿ])" + r"\s+".join(map(re.escape, phrase.split(" "))) + r"(?![\wÀ-ÿ])"
                      if phrase[-1].isalnum() else
                      r"(?<![\wÀ-ÿ])" + r"\s+".join(map(re.escape, phrase.split(" "))))


PHRASE_RX = [(_ci(a), b) for a, b in PHRASES]
WORD_RX = []
for a, b in WORDS.items():
    WORD_RX.append((re.compile(r"(?<![\wÀ-ÿ-])" + re.escape(a) + r"(?![\wÀ-ÿ-])"), b))
    if a[0].islower():
        WORD_RX.append((re.compile(r"(?<![\wÀ-ÿ-])" + re.escape(a[0].upper() + a[1:]) + r"(?![\wÀ-ÿ-])"),
                        b[0].upper() + b[1:]))


def possessives(text):
    """'Sua operação' -> 'A sua operação'; 'de seu' -> 'do seu'; 'em sua' -> 'na sua'."""
    out, last = [], 0
    for m in re.finditer(r"(?<![\wÀ-ÿ])(seu|sua|seus|suas|nosso|nossa|nossos|nossas|Seu|Sua|Seus|Suas|Nosso|Nossa|Nossos|Nossas)(?![\wÀ-ÿ])", text):
        word = m.group(1)
        art = POSSESSIVES[word.lower()]
        before = text[last:m.start()]
        prev = re.search(r"([\wÀ-ÿ]+)(\s+)$", text[:m.start()])
        prev_word = prev.group(1).lower() if prev else ""
        if prev_word in HAS_ARTICLE:
            out.append(before + word)
        elif prev_word in ("de", "em") and prev:
            contr = ("d" if prev_word == "de" else "n") + art
            cut = len(before) - len(prev.group(0))
            out.append(before[:cut] + contr + prev.group(2) + word)
        elif word[0].isupper():
            out.append(before + art.capitalize() + " " + word.lower())
        else:
            out.append(before + art + " " + word)
        last = m.end()
    out.append(text[last:])
    return "".join(out)


def translate(text, phrases_only=False):
    masks = []

    def keep(m):
        masks.append(m.group(0))
        return f"\x00{len(masks) - 1}\x00"

    text = MASK.sub(keep, text)
    for rx, rep in PHRASE_RX:
        text = rx.sub(rep, text)
    text = re.sub(r"(?<![\wÀ-ÿ])(precisa|precisam|precisar)\s+(?!de\s)([a-zà-ú]+(?:ar|er|ir))(?![\wÀ-ÿ])",
                  r"\1 de \2", text)
    if not phrases_only:
        for rx, rep in WORD_RX:
            text = rx.sub(rep, text)
        text = possessives(text)
    return re.sub(r"\x00(\d+)\x00", lambda m: masks[int(m.group(1))], text)


ATTRS = re.compile(r'(\s(?:alt|content|aria-label|title|placeholder)=")([^"]*)(")')


def translate_html(src):
    parts = re.split(r"(<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<[^>]+>)", src, flags=re.S)
    out = []
    for part in parts:
        if part.startswith("<script"):
            if "ld+json" in part:
                part = part.replace('"inLanguage": "pt-BR"', '"inLanguage": "pt-PT"')
                part = re.sub(r'("description":\s*")([^"]*)(")', lambda m: m.group(1) + translate(m.group(2)) + m.group(3), part)
            else:  # versão pt dos scripts, para não reaproveitar o cache da versão do Brasil
                part = re.sub(r'(src="js/(?:home|script)\.js)(\?[^"]*)?"',
                              lambda m: m.group(1) + ((m.group(2) + "&") if m.group(2) else "?") + 'l=pt"', part)
            out.append(part)
        elif part.startswith("<style") or part.startswith("<!--"):
            out.append(part)
        elif part.startswith("<"):
            out.append(ATTRS.sub(lambda m: m.group(1) + translate(m.group(2)) + m.group(3), part))
        else:
            out.append(translate(part))
    html = "".join(out)
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-PT">')
    return html


JS_STRING = re.compile(r'"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`')


def translate_js(src, phrases_only):
    def tr(m):
        s = m.group(0)
        body = s[1:-1]
        if re.fullmatch(r"[a-z0-9_#.\-/ ]*", body):  # identificadores, seletores, nomes de arquivo
            return s
        return s[0] + translate(body, phrases_only) + s[-1]
    out = JS_STRING.sub(tr, src)
    if not phrases_only:  # dados ilustrativos em euros, no formato de Portugal
        out = out.replace('"R$ "]', '"", " €"]').replace('toLocaleString("pt-BR")', 'toLocaleString("pt-PT")')
    return out


def main():
    os.makedirs(os.path.join(OUT, "js"), exist_ok=True)
    pages = sorted(glob.glob(os.path.join(ROOT, "*.html")))
    for p in pages:
        name = os.path.basename(p)
        with open(p, encoding="utf-8") as f:
            html = translate_html(f.read())
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(html)
    for js in JS_FILES:
        with open(os.path.join(ROOT, js), encoding="utf-8") as f:
            out = translate_js(f.read(), phrases_only=js.endswith("script.js"))
        with open(os.path.join(OUT, js), "w", encoding="utf-8") as f:
            f.write(out)
    print(f"pt-PT gerado: {len(pages)} páginas e {len(JS_FILES)} scripts em {os.path.relpath(OUT, ROOT)}/")


if __name__ == "__main__":
    sys.exit(main())
