# 🐞 Bugs Conhecidos - Hera Browser

Este documento lista bugs conhecidos que serão corrigidos em versões futuras.

---

## v2.0.6 (Em Desenvolvimento)

### 1. Downloads mostram status "Cancelado" após conclusão
**Severidade:** 🟡 Média  
**Impacto:** Visual apenas  
**Versão afetada:** v2.0.5.1  

**Descrição:**
Quando um download é concluído com sucesso, a página `hera://downloads` mostra o status como "Cancelado" em vez de "Concluído". O arquivo é baixado corretamente e está disponível na pasta de downloads.

**Comportamento esperado:**
- Download deve mostrar progresso durante o download
- Ao concluir, deve mostrar status "Concluído" com ícone verde
- Botão "Abrir arquivo" deve estar disponível

**Comportamento atual:**
- Download mostra progresso corretamente
- Ao concluir, status muda para "Cancelado"
- Arquivo está salvo corretamente na pasta de downloads

**Workaround:**
- Arquivos são baixados corretamente
- Verificar pasta de downloads manualmente
- Clicar em "Mostrar na pasta" funciona corretamente

**Causa provável:**
- Evento `download-complete` não está sendo recebido
- `savePath` pode não corresponder entre eventos `download-started` e `download-complete`
- Possível race condition no timing dos eventos

**Investigação em andamento:**
```javascript
// Adicionar logs para debug:
console.log('[Download Started] savePath:', item.getSavePath());
console.log('[Download Complete] savePath:', item.getSavePath());
// Comparar se são idênticos
```

**Planejado para:** v2.0.6

---

### 2. Database not initialized no modo dev (npm start)
**Severidade:** 🟡 Média  
**Impacto:** Desenvolvimento apenas  
**Versão afetada:** v2.0.5.1  

**Descrição:**
Ao executar `npm start`, o banco de dados SQLite não é inicializado corretamente, causando erros "Database not initialized" ao tentar acessar histórico ou favoritos.

**Comportamento esperado:**
- Banco deve inicializar no `app.whenReady()`
- Histórico e favoritos devem funcionar normalmente

**Comportamento atual:**
- Banco não inicializa no modo dev
- Funciona corretamente na build (`npm run package`)

**Workaround:**
- Usar `npm run package` para testar funcionalidades do banco
- Build empacotada funciona corretamente

**Causa provável:**
- Webpack dev server pode estar interferindo com paths
- `app.getPath('userData')` pode retornar path diferente no dev
- Better-sqlite3 pode não estar sendo carregado corretamente no dev

**Planejado para:** v2.0.6

---

## v2.0.5 (Resolvidos em v2.0.5.1)

### ✅ Memory leak em listeners `found-in-page`
**Status:** Corrigido em v2.0.5.1  
**Descrição:** Listeners acumulavam em memória ao fechar abas  
**Solução:** Adicionado cleanup adequado de listeners

### ✅ Race condition no Find in Page
**Status:** Corrigido em v2.0.5.1  
**Descrição:** Estado de busca restaurado na aba errada  
**Solução:** Adicionado delay e validação de tabId

---

## Como Reportar Bugs

Se você encontrou um bug não listado aqui:

1. **Verifique se já foi reportado** neste documento
2. **Colete informações:**
   - Versão do Hera Browser
   - Sistema operacional
   - Passos para reproduzir
   - Logs do console (se disponível)
3. **Crie uma issue** no repositório com o template:

```markdown
### Descrição do Bug
[Descrição clara e concisa]

### Passos para Reproduzir
1. Abrir...
2. Clicar em...
3. Ver erro...

### Comportamento Esperado
[O que deveria acontecer]

### Comportamento Atual
[O que está acontecendo]

### Ambiente
- Versão: v2.0.5.1
- OS: Windows 10
- Electron: 38.4.0

### Logs
```
[Cole logs relevantes aqui]
```

### Screenshots
[Se aplicável]
```

---

## Priorização de Bugs

### 🔴 Crítico
- Crashes
- Perda de dados
- Vulnerabilidades de segurança
- Funcionalidades principais quebradas

### 🟡 Importante
- Bugs visuais significativos
- Funcionalidades secundárias quebradas
- Performance degradada
- UX prejudicada

### 🟢 Menor
- Bugs visuais menores
- Inconsistências de UI
- Melhorias de UX
- Edge cases raros

---

**Última atualização:** 06/11/2025  
**Versão atual:** v2.0.5.1 (Hotfix)
