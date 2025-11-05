# 📦 Guia de Release - Hera Browser

## 🚀 Processo Completo de Release

### Passo 1: Build do Projeto

```bash
# Instala dependências (se necessário)
npm install

# Recompila módulos nativos
npm run rebuild

# Cria o executável
npm run package

# Cria o instalador
npm run make
```

**Resultado:** Arquivos gerados em `out/make/squirrel.windows/x64/`

---

### Passo 2: Commit e Tag

```bash
# Adiciona todos os arquivos
git add .

# Commit com mensagem
git commit -F COMMIT_MESSAGE_v2.0.4.txt

# Cria a tag
git tag v2.0.4

# Push
git push origin main --tags
```

---

### Passo 3: Criar Release no GitHub

#### Opção A: Interface Web (Recomendado para primeira vez)

1. **Acesse:** `https://github.com/SEU_USUARIO/hera-browser/releases/new`

2. **Preencha:**
   - **Tag:** `v2.0.4` (selecione da lista)
   - **Title:** `v2.0.4 - Polish Update`
   - **Description:** Cole o conteúdo de `GITHUB_RELEASE_NOTES.md`

3. **Anexe os arquivos:**
   - Arraste os arquivos de `out/make/squirrel.windows/x64/` para a área "Attach binaries"
   - Ou clique em "Attach binaries" e selecione:
     - `hera-browser-2.0.4 Setup.exe` (instalador principal)
     - `hera-browser-2.0.4-full.nupkg` (pacote completo)
     - `RELEASES` (arquivo de metadados)

4. **Marque:**
   - ✅ "Set as the latest release"

5. **Publique:**
   - Clique em "Publish release"

#### Opção B: GitHub CLI (Mais Rápido)

```bash
gh release create v2.0.4 \
  --title "v2.0.4 - Polish Update" \
  --notes-file GITHUB_RELEASE_NOTES.md \
  out/make/squirrel.windows/x64/*.exe \
  out/make/squirrel.windows/x64/*.nupkg \
  out/make/squirrel.windows/x64/RELEASES
```

---

### Passo 4: Verificar

1. Acesse: `https://github.com/SEU_USUARIO/hera-browser/releases`
2. Verifique se a release v2.0.4 aparece
3. Teste o download do instalador
4. Teste a instalação

---

## 🎯 Script Automático

Para facilitar, use o script:

```bash
build-and-release.bat
```

Este script faz:
1. ✅ Build do projeto
2. ✅ Cria o instalador
3. ✅ Commit e tag
4. ✅ Push para o GitHub
5. ℹ️ Mostra instruções para anexar arquivos

---

## 📁 Arquivos Gerados

Após o build, você terá:

```
out/
└── make/
    └── squirrel.windows/
        └── x64/
            ├── hera-browser-2.0.4 Setup.exe    (Instalador - ~150MB)
            ├── hera-browser-2.0.4-full.nupkg   (Pacote completo)
            └── RELEASES                         (Metadados)
```

**Anexe todos esses arquivos na release!**

---

## 🎨 Dicas

### Nomes dos Arquivos
- O instalador será algo como: `hera-browser-2.0.4 Setup.exe`
- Você pode renomear para: `HeraBrowser-v2.0.4-Windows-Setup.exe`

### Descrição da Release
- Use emojis para destacar seções
- Seja claro sobre o que mudou
- Inclua screenshots se possível
- Mencione problemas conhecidos

### Assets (Arquivos)
- **Obrigatório:** `.exe` (instalador)
- **Recomendado:** `.nupkg` e `RELEASES` (para auto-update)
- **Opcional:** `.zip` com portable version

---

## ⚠️ Checklist Antes de Publicar

- [ ] Build funcionando sem erros
- [ ] Versão atualizada no `package.json` (2.0.4)
- [ ] CHANGELOG.md atualizado
- [ ] README.md atualizado
- [ ] Testou o instalador localmente
- [ ] Commit e tag criados
- [ ] Push feito para o GitHub
- [ ] Release notes preparadas
- [ ] Arquivos anexados na release

---

## 🐛 Problemas Comuns

### "npm run make" falha
- Execute `npm run rebuild` primeiro
- Verifique se tem espaço em disco
- Tente deletar `node_modules` e `npm install` novamente

### Instalador muito grande
- Normal! O Electron empacota o Chromium (~150MB)
- Considere usar ASAR para comprimir

### Auto-update não funciona
- Certifique-se de incluir `.nupkg` e `RELEASES` na release
- Configure o `autoUpdater` no código

---

**Boa sorte com o lançamento! 🚀**
