import Item from './Item';
import Player from './Player';
import Game from './Game';
import Tile from './Tile';

const types = ["bomb","catnip","spring"];

const ItemBuilder = (type:string,tile:Tile) => {
    if(!types.includes(type)) {
        return null;
    }
    if (type === "bomb") {
        const newItem = new Item({
            type:"special",
            tile:tile,
            appearance: {
                content: `<img src="./assets/catBomb.png" alt="Cat bomb.">`,
                classList:[]
            },
            name:"cat bomb",
            useVerb:"Activate",
            onUse:(me:Item,user:Player,game:Game) => {
                // The bomb has been planted...
                game.buildMessage("Run!!!","bad");
                const setTile = user.getTile();

                setTile.setContent(`<img src="./assets/catBombLit.png" alt="Cat bomb lit.">`);
                const explodedTiles:Tile[] = [];
                // Explode
                game.event.add({
                    delay: 6,
                    callback:()=>{
                        const boomString:string[] = ['B'];
                        const numOs = game.random.getNumber(2,4);
                        const numXs = game.random.getNumber(1,4);
                        for(let i=0;i<numOs;i++) {
                            boomString.push('O');
                        } 
                        boomString.push('M');
                        for(let i=0;i<numXs;i++) {
                            boomString.push('!');
                        } 
                        game.buildMessage(boomString.join(""),"good");
                        setTile.applyToAll((tile:Tile)=>{
                            if(tile.passable) {
                                explodedTiles.push(tile);
                                if(tile.critter) {
                                    user.gainXP(tile.critter.attackMe(game.random.getNumber(8,15)));
                                }
                                tile.setContent('*');
                                tile.addClass("explosion");
                                return true;
                            } else {
                                return false;
                            }
                        },4);
                        // Just in case the player died...
                        user.fov.look(user.getTile());
                    }
                });

                // Cleanup
                game.event.add({
                    delay: 7,
                    callback:()=>{
                        explodedTiles.forEach(tile=>{
                            tile.removeClass("explosion");
                            tile.setTile({
                                content:'.',
                                classList:['floor','scorch']
                            })
                        })
                    }
                });
                return null;
            }
        });
        return newItem;
    } else if(type==="catnip") {
        const newItem = new Item({
            type:"special",
            tile:tile,
            appearance: {
                content: `<img src="./assets/catnip.png" alt="Catnip.">`,
                classList:[]
            },
            name:"catnip",
            useVerb:"Use",
            onUse:(me:Item,user:Player,game:Game) => {
                if (!user.powerful) {
                    game.displayDiv.classList.add("high");
                    user.powerful = true;
                    game.buildMessage("You feel unstoppable!","good");
                    game.event.add({
                        delay: 21,
                        callback:()=>{
                            game.displayDiv.classList.remove("high");
                            user.powerful = false;
                            game.buildMessage("The catnip has worn off.","good");
                        }
                    });
                    return null;
                } else {
                    game.buildMessage("Wait until the old stuff wears off!");
                    return me;
                }
            }
        });
        return newItem;
    }
}

export default ItemBuilder;