#### States and Button labels/action

##### initial state, no walls, no path- state I

##### before searching; no colored squares, walls exist - state B
- **Start Search** - to N
- **Pause Search** - button disabled (grayed out)
- **Clear Walls** - to I

##### starting a new search - state N
This state clears any existing search progress and then immediately goes to state S.

##### during searching - state S
- **Restart Search** - to N
- **Pause Search** - to P
- **Clear Walls** - to I

when search has finished - to F

##### search is paused - state P
- **Resume Search** - to S
- **Cancel Search** - to B
- **Clear Walls** - to I

##### search has finished - state F
- **Restart Search** - to N
- **Clear Path** - to B
- **Clear Walls** - to I

selecting a different algorithm or adding or deleting walls - to M

##### after search has finished and user has changed settings - state M
- **Start Search** - to N
- **Clear Path** - to B
- **Clear Walls** - to I
