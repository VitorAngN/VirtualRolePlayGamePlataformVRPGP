# A Máquina de Estados (FSM) no Servidor Golang

## Por que usar uma Máquina de Estados?
VTTs clássicos frequentemente confiam na "Honra" dos jogadores ou dependem que o Mestre corrija ações equivocadas manualmente. Com o VTT Lite, queremos um motor robusto que aplique regras (SRD 5e) nativamente.

Para gerenciar o combate e evitar *Race Conditions* (dois usuários modificando a mesma coisa na mesma fração de segundo), o backend implementa uma **FSM (Finite State Machine)** em Go.

## Os Estados da Sala de Jogo (Room State)

A sala de jogo sempre estará em um dos seguintes estados principais:

1. **`EXPLORATION_MODE`**: 
   - Estado livre. Jogadores podem mover seus tokens livremente, sem restrição de grid por turno.
   - Ideal para exploração de dungeons fora de combate ou roleplay social.

2. **`COMBAT_INITIATIVE_ROLL`**:
   - O Mestre ativa o combate.
   - O servidor trava movimentações livres.
   - O servidor aguarda o payload de "Rolagem de Iniciativa" de todos os clientes conectados (via Desktop ou Companion Mobile).

3. **`COMBAT_TURN_ACTIVE`**:
   - O servidor ordena os turnos com base na iniciativa.
   - Apenas o Token correspondente ao `CurrentTurnId` tem permissão de enviar o comando `MOVE_TOKEN` ou `ACTION_ATTACK`.
   - Se um jogador tentar mover um token fora do seu turno, o Go Server rejeita a ação e o React no cliente faz o token "voltar" para a posição original (efeito elástico).

4. **`COMBAT_TURN_RESOLUTION`**:
   - Ocorre no exato momento em que um ataque é declarado. 
   - O servidor aguarda a rolagem de dano ou reações, faz os cálculos, atualiza o Redis e volta para `COMBAT_TURN_ACTIVE`.

## Como o Golang lida com isso (Channels & Goroutines)

Cada Sala instanciada no servidor Go rodará dentro de uma **Goroutine dedicada**.
Dentro dessa Goroutine, um **Channel** (fila) receberá todos os comandos daquela sala de forma síncrona.

```go
// Exemplo conceitual do Game Loop do Servidor
func (room *Room) Run() {
    for {
        select {
        case action := <-room.ActionQueue:
            // 1. A Fila garante que processamos 1 ação por vez, eliminando Race Conditions.
            
            // 2. Valida o Estado
            if room.State == COMBAT_TURN_ACTIVE && action.PlayerID != room.CurrentTurnPlayer {
                 // Discard and send Error (Não é o turno dele)
                 continue
            }

            // 3. Aplica regras e muta o Estado
            err := room.ProcessAction(action)
            if err == nil {
                // 4. Se a ação é válida, sincroniza a mudança via Broadcast
                room.BroadcastDelta(action)
            }
        }
    }
}
```

## Anti-Trapaça (Cheat Prevention)
Como a lógica roda no Servidor e as rolagens de dados podem ser feitas no cliente mobile:
Se adotarmos que os dados giram no celular do jogador de forma 3D (para diversão visual), o resultado final **não** é gerado pelo cliente. 
O servidor envia para o mobile a *Semente Criptográfica* ou a física em si, ou simplesmente o servidor calcula o resultado `X` e manda o cliente mobile rodar a animação física de modo que o dado caia sempre na face `X`. Assim o cálculo final é de responsabilidade da nuvem.
