# Type Tests

Este diretório contém testes de tipo que validam a correção dos tipos em tempo de compilação.

## Arquivos

### api.types.test.ts
Testa a interface `HeraAPI` e todos os seus métodos, incluindo:
- Métodos de gerenciamento de abas
- Métodos de navegação
- Métodos de janela
- Métodos de download
- Métodos de histórico
- **Métodos de bookmark (críticos)**
- Métodos de configurações
- Métodos de visualização
- Event listeners

### database.types.test.ts
Testa as interfaces de banco de dados:
- `HistoryEntry` - Entradas de histórico de navegação
- `Bookmark` - Favoritos do usuário
- `BookmarkFolder` - Pastas de favoritos
- `TabState` - Estado de abas para persistência

## Como Funcionam

Estes testes usam o sistema de tipos do TypeScript para validar que:
1. Todos os tipos estão definidos corretamente
2. Propriedades opcionais são realmente opcionais
3. Propriedades obrigatórias são realmente obrigatórias
4. Tipos de retorno correspondem às expectativas
5. Parâmetros de função têm os tipos corretos

Se houver um erro de tipo, a compilação TypeScript falhará, indicando que algo está errado com as definições de tipo.

## Executando os Testes

Os testes de tipo são executados automaticamente durante a compilação TypeScript:

```bash
npm run type-check
```

**Nota sobre erros do node_modules**: Atualmente, há erros de compilação provenientes do pacote `@types/node` (especificamente em `https.d.ts`). Estes são erros conhecidos de compatibilidade entre versões do TypeScript e @types/node, e **não afetam nossos tipos personalizados**.

Nossos arquivos de teste (`api.types.test.ts` e `database.types.test.ts`) estão corretos e compilam sem erros quando isolados. Os erros que aparecem são apenas do node_modules.

## Utility Types Usados

### AssertTrue<T extends true>
Valida que um tipo é exatamente `true`. Se for `false`, gera erro de compilação.

### IsExact<T, U>
Verifica se dois tipos são exatamente iguais (não apenas compatíveis).

### IsAssignable<T, U>
Verifica se T pode ser atribuído a U (T extends U).

### IsOptional<T, K>
Verifica se uma propriedade K em T é opcional.

### IsRequired<T, K>
Verifica se uma propriedade K em T é obrigatória.

## Exemplos de Testes

```typescript
// Valida que addBookmark retorna Promise<Bookmark>
type TestAddBookmark_ReturnType = AssertTrue<
  IsExact<
    ReturnType<HeraAPI['addBookmark']>,
    Promise<Bookmark>
  >
>;

// Valida que Bookmark.url é opcional
type TestBookmark_UrlIsOptional = AssertTrue<
  IsOptional<Bookmark, 'url'>
>;

// Valida que Bookmark.id é obrigatório
type TestBookmark_IdIsRequired = AssertTrue<
  IsRequired<Bookmark, 'id'>
>;
```

## Benefícios

1. **Detecção Precoce de Erros**: Erros de tipo são detectados em tempo de compilação, não em runtime
2. **Documentação Viva**: Os testes servem como documentação dos tipos esperados
3. **Refatoração Segura**: Mudanças que quebram tipos são detectadas imediatamente
4. **CI/CD**: Podem ser integrados ao pipeline de CI/CD para prevenir merges com erros de tipo

## Manutenção

Ao adicionar novos métodos ou modificar interfaces existentes:
1. Adicione testes de tipo correspondentes
2. Execute `npm run type-check` para validar
3. Atualize esta documentação se necessário

## Referências

- [TypeScript Handbook - Type Manipulation](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Type-Level Programming in TypeScript](https://type-level-typescript.com/)
