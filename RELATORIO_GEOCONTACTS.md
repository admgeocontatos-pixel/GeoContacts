# Relatório do Projeto GeoContacts

**Data:** 22 de setembro de 2026  
**Projeto:** GeoContacts  
**Plataforma principal:** Android, com aplicativo desenvolvido em React Native e Expo  
**Status geral:** MVP funcional em testes, com a publicação da versão mais recente do backend ainda pendente

## 1. Objetivo do aplicativo

O GeoContacts foi criado para permitir que uma pessoa encontre contatos e outros usuários do aplicativo que estejam próximos à sua localização. A proposta combina a agenda de contatos do celular, autenticação de usuários e localização geográfica em um único aplicativo móvel.

O objetivo do MVP é oferecer uma experiência simples e segura para que o usuário possa:

- acessar os contatos reais armazenados no celular, mediante autorização;
- criar uma conta ou entrar usando e-mail e senha;
- entrar por meio de uma conta Google;
- autorizar o acesso à localização do dispositivo;
- enviar sua posição atual ao backend;
- visualizar usuários autenticados que estejam próximos, organizados por distância;
- controlar a sessão e sair do aplicativo de forma correta.

A localização não deve ser usada como um dado permanente e irrestrito. O sistema foi estruturado para trabalhar com atualizações recentes, de modo que a lista de usuários próximos represente pessoas que estejam ativas e tenham enviado sua localização recentemente.

## 2. Como o sistema foi estruturado

O aplicativo móvel foi desenvolvido com **React Native**, **Expo SDK 57**, **Expo Router**, TypeScript e NativeWind. O Expo Router organiza as telas e permite separar a área pública de login da área protegida das abas principais.

O backend é uma API Node.js com Express. O projeto também utiliza tRPC para chamadas tipadas entre o aplicativo e o servidor. O banco de dados é PostgreSQL hospedado no Supabase, com acesso realizado por Drizzle ORM e o driver `postgres.js`.

A implantação planejada utiliza o GitHub como repositório de código e o Render como serviço de hospedagem do backend. Os APKs de teste são gerados pelo EAS Build e instalados diretamente no dispositivo Android.

A arquitetura pode ser resumida da seguinte forma:

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Aplicativo móvel | React Native, Expo SDK 57 e Expo Router | Telas, permissões, GPS, agenda e sessão do usuário |
| Comunicação | tRPC e endpoints REST | Envio de autenticação, localização e consultas |
| Backend | Node.js e Express | Autenticação, validação, sessões e regras da aplicação |
| Persistência | PostgreSQL no Supabase | Usuários, credenciais e coordenadas recentes |
| ORM | Drizzle ORM | Definição do schema e operações tipadas no banco |
| Hospedagem | Render | Execução pública da API e redeploy a partir do GitHub |
| Distribuição de testes | EAS Build | Geração do APK de preview para Android |

## 3. O que já foi realizado

### 3.1 Migração e preparação do aplicativo Android

O protótipo foi atualizado do Expo SDK 54 para o Expo SDK 57, que corresponde ao ambiente instalado no dispositivo utilizado nos testes. Essa migração foi necessária para reduzir incompatibilidades entre o aplicativo e o Expo instalado no celular.

Foi gerado um APK de preview instalável diretamente no Android. Isso permitiu testar o aplicativo sem depender do Expo Go. Também foi esclarecido que alterações feitas depois da instalação não aparecem automaticamente no APK antigo; cada alteração que precisa ser testada no aparelho exige um novo build.

### 3.2 Acesso aos contatos reais do celular

A tela de contatos deixou de depender dos quatro contatos de exemplo que existiam no protótipo. Ela passou a utilizar a biblioteca `expo-contacts` para solicitar a permissão do sistema e ler a agenda real do dispositivo.

O fluxo atual solicita a permissão de contatos e, quando ela é concedida, carrega os registros disponíveis no telefone. A tela apresenta nome, telefone, e-mail e imagem quando esses dados são fornecidos pelo sistema operacional. Também foram adicionados pesquisa, seleção individual e opção de selecionar todos os contatos exibidos.

Quando a permissão é negada ou ocorre uma falha, o aplicativo informa que não conseguiu acessar a agenda em vez de encerrar inesperadamente.

### 3.3 Autenticação por e-mail e senha

Foi criada uma tela de login com os modos de entrada e cadastro. O aplicativo envia os dados para os endpoints:

- `POST /api/auth/email/register`;
- `POST /api/auth/email/login`.

O backend valida o formato do e-mail e o tamanho mínimo da senha. As senhas são armazenadas utilizando derivação criptográfica com salt, e não em texto simples. Depois do cadastro ou login, o servidor emite um token de sessão.

Durante os testes, foram corrigidos problemas de schema no PostgreSQL, incluindo a criação da coluna `passwordHash` e de outras colunas esperadas pela tabela `users`. Também foi configurado um segredo JWT no ambiente do Render para permitir a emissão das sessões.

### 3.4 Login com Google

Foi implementado o fluxo de autenticação externa pelo Google OAuth. O backend utiliza um callback HTTPS fixo:

`https://geocontacts-dn1j.onrender.com/api/auth/google/callback`

Também foi incluído o ajuste `app.set("trust proxy", 1)` no Express, necessário para que o servidor reconheça corretamente HTTPS quando está atrás do proxy reverso do Render.

O callback troca o código recebido do Google por tokens, consulta o perfil do usuário, sincroniza o usuário no PostgreSQL e devolve uma sessão para o aplicativo. O fluxo inclui os caminhos de callback utilizados nas versões anteriores para manter compatibilidade.

### 3.5 GPS real e localização

O aplicativo passou a utilizar `expo-location` para solicitar a permissão de localização em primeiro plano. Quando o usuário autoriza, o aplicativo captura a posição com:

`getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`

A posição atual é exibida na tela inicial como latitude e longitude. O contexto de localização também guarda a última posição localmente e pode acompanhar alterações de posição por meio de `watchPositionAsync`.

Foram adicionados tratamentos para os principais cenários de falha:

- o usuário nega a permissão;
- o GPS do celular está desativado;
- o dispositivo está sem sinal ou não consegue obter uma posição;
- uma chamada de rede falha;
- o usuário está deslogado e não pode publicar a posição no backend.

Nesses casos, o aplicativo mantém a posição local quando possível e mostra uma mensagem explicando o que precisa ser corrigido.

### 3.6 Busca de usuários próximos

O banco contém a tabela `user_locations`, que armazena uma posição atual por usuário, junto com precisão e horário da atualização. O backend calcula a distância entre a posição informada e as posições armazenadas usando a fórmula de Haversine.

A consulta exclui o próprio usuário, considera apenas localizações atualizadas recentemente e retorna os resultados ordenados pela distância. A tela inicial permite escolher raios de busca como 1, 5, 10 e 20 quilômetros.

Também foi adicionada uma atualização redundante na tabela `users`, com as colunas:

- `latitude`;
- `longitude`;
- `lastLocationUpdate`.

Essa duplicação permite manter a posição resumida junto ao registro do usuário, sem remover a tabela específica de histórico ou estado de localização.

### 3.7 Logout

O botão **Sair** foi corrigido. Ao ser acionado, o aplicativo tenta encerrar a sessão no backend, remove o token armazenado localmente, remove as informações do usuário, limpa o estado de autenticação e utiliza `router.replace("/login")` para impedir o retorno à área autenticada pelo botão voltar.

Um novo APK com essa correção foi gerado e disponibilizado para instalação no dispositivo.

## 4. Implementações técnicas recentes de geolocalização

A implementação mais recente adicionou ao backend os endpoints REST abaixo:

### Atualização da posição

`PUT /api/user/location`

Esse endpoint exige autenticação por Bearer token e recebe um corpo semelhante a:

```json
{
  "latitude": -23.55052,
  "longitude": -46.63331,
  "accuracy": 25
}
```

O backend valida os limites das coordenadas, atualiza `user_locations` e sincroniza as colunas de localização em `users`.

### Consulta de contatos próximos

`GET /api/contacts/nearby?latitude=-23.55052&longitude=-46.63331&radiusKm=10`

O endpoint exige autenticação, valida as coordenadas e o raio, calcula a distância e devolve os usuários próximos ordenados do mais próximo para o mais distante.

O fluxo tRPC existente também foi mantido, porque a tela inicial já utilizava `location.update` e `location.nearby`. Dessa forma, a implementação não removeu o caminho tipado já existente enquanto adicionava os endpoints REST solicitados.

## 5. Situação atual do banco de dados

O schema Drizzle foi atualizado para representar as colunas de localização em `users` e a tabela `user_locations`. A migração SQL foi tornada idempotente para que as colunas possam ser criadas apenas quando ainda não existirem:

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS "latitude" double precision,
ADD COLUMN IF NOT EXISTS "longitude" double precision,
ADD COLUMN IF NOT EXISTS "lastLocationUpdate" timestamp with time zone;
```

A existência das tabelas e colunas principais do banco já foi verificada durante as etapas anteriores do projeto. A publicação definitiva da versão mais recente do backend depende, entretanto, de que o commit de GPS seja enviado ao repositório conectado ao Render.

## 6. Validações realizadas

Após os ajustes de GPS, foram executados:

- `pnpm check`, para verificar o TypeScript;
- `pnpm test -- --run`, para executar os testes disponíveis;
- `git diff --check`, para verificar problemas de whitespace no diff;
- build Android de preview pelo EAS.

A verificação TypeScript foi concluída com sucesso. Os testes disponíveis também foram executados sem falhas ativas. O teste de logout existente permanece marcado como `skip` no projeto, portanto ele não constitui uma validação automatizada ativa.

O APK de GPS foi compilado com sucesso pelo EAS e disponibilizado para teste no dispositivo Android.

## 7. O que estamos tentando concluir agora

O objetivo imediato é publicar a versão final das alterações de GPS no GitHub para que o Render faça o redeploy do backend. O commit local preparado para essa publicação é:

```text
718505f feat: implement GPS location sync and nearby contacts
```

Esse commit contém a implementação das colunas de localização, os endpoints REST, a sincronização de banco e o tratamento mais robusto do GPS no aplicativo.

O push ainda não foi concluído porque a credencial GitHub disponível no ambiente foi rejeitada como inválida. O conector GitHub também permanece desabilitado no ambiente, mesmo após tentativas de solicitar sua habilitação. Como consequência, o Render não recebeu o commit `718505f` e o deploy do backend ainda não foi iniciado.

Existe ainda uma alteração local separada em `hooks/use-auth.ts`, relacionada ao logout. Ela aparece como modificada no diretório de trabalho e deve ser revisada antes de um eventual commit posterior, para evitar incluir ou excluir mudanças sem intenção.

## 8. Próximos passos necessários

A sequência recomendada para concluir o MVP é a seguinte:

1. Habilitar efetivamente o conector GitHub ou fornecer um novo Personal Access Token com permissão de escrita no conteúdo do repositório `admgeocontatos-pixel/GeoContacts`.
2. Executar `git push origin main` a partir do projeto local, publicando o commit `718505f`.
3. Confirmar no Render que o deploy iniciado corresponde ao commit publicado.
4. Executar uma verificação de saúde em `GET /api/health`.
5. Testar, com uma sessão válida, `PUT /api/user/location` e `GET /api/contacts/nearby`.
6. Instalar o APK de GPS no Android e conceder a permissão de localização.
7. Confirmar que a latitude e a longitude aparecem na tela inicial e que a posição é enviada ao backend.
8. Testar o comportamento com o GPS desativado, com a permissão negada e sem conexão de rede.
9. Testar dois usuários autenticados em posições próximas para confirmar a ordenação por distância.
10. Rotacionar credenciais que tenham sido compartilhadas durante a configuração inicial, especialmente tokens de acesso e segredos OAuth, antes de considerar o ambiente pronto para produção.

## 9. Conclusão

O GeoContacts evoluiu de um protótipo com dados simulados para um MVP com agenda real do celular, autenticação por e-mail, integração com Google, sessão persistente, logout funcional e geolocalização real no Android.

A parte móvel já foi compilada em APK e está pronta para novos testes. A lógica de GPS e de busca por proximidade também foi implementada no backend localmente. O principal bloqueio atual não é de código, mas de publicação: o commit que contém a versão final do backend ainda não foi enviado ao GitHub por falta de uma credencial autorizada. Após resolver essa autenticação, o Render poderá fazer o deploy e o teste ponta a ponta poderá ser concluído.

## Referências

[1]: https://docs.expo.dev/versions/latest/sdk/location/ "Expo Location — documentação oficial"

[2]: https://docs.expo.dev/versions/latest/sdk/contacts/ "Expo Contacts — documentação oficial"

[3]: https://supabase.com/docs/guides/database "Supabase Database — documentação oficial"

[4]: https://orm.drizzle.team/docs/overview "Drizzle ORM — documentação oficial"

[5]: https://docs.render.com/deploys "Render Deploys — documentação oficial"

[6]: https://docs.github.com/en/rest/repos/contents "GitHub Repository Contents API — documentação oficial"

**Autor:** Manus AI
