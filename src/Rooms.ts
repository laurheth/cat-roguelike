import { Random } from 'roguelike-pumpkin-patch';
import RoomBuilder from './RoomBuilder';

type Theme = {[key:string]:string[]}

/** Rectangleroom */
const rectangleRoom = (range:[number,number], rng:Random,
    theme:Theme
)=>{
    const plan:string[][] = [];
    const width = rng.getNumber(...range);
    const height = rng.getNumber(...range);
    for(let i=0;i<=width;i++) {
        const row:string[] = [];
        for(let j=0;j<=height;j++) {
            if (i===0 || j===0 || i===width || j===height) {
                row.push('#');
            } else {
                row.push('.');
            }
        }
        plan.push(row);
    }

    return RoomBuilder(plan,theme);
}

const templateRoom = (range:[number,number],rng:Random, theme:Theme, template:string[], middle:[number,number]) => {
    const plan = template.map(row=>row.split(''));

    const rowRepeats = rng.getNumber(...range);
    const colRepeats = rng.getNumber(...range);
    // Add extra columns
    plan.forEach((row,j)=>{
        const added:string[] = [];
        for(let i=1;i<colRepeats;i++) {
            added.push(plan[j][middle[0]]);
        }
        plan[j].splice(middle[0],0,...added);
    });
    // Add extra rows
    const extraRows:string[][] = [];
    for(let i=1;i<rowRepeats;i++) {
        extraRows.push(plan[middle[1]]);
    }
    plan.splice(middle[1],0,...extraRows);

    return RoomBuilder(plan,theme);
}

const hollowSquareRoom = (range:[number,number],rng:Random, theme:Theme) => {
    return templateRoom(range, rng, theme,
        [
            "#########",
            "#.......#",
            "#.......#",
            "#..###..#",
            "#..# #..#",
            "#..###..#",
            "#.......#",
            "#.......#",
            "#########",
        ], [4,4])
}

const octoRoomSmall = (range:[number,number],rng:Random, theme:Theme) => {
    return templateRoom(range, rng, theme,
        [
            " ### ",
            "##.##",
            "#...#",
            "##.##",
            " ### ",
        ], [2,2])
}

const octoRoom = (range:[number,number],rng:Random, theme:Theme) => {
    return templateRoom(range, rng, theme,
        [
            "   ###   ",
            "  ##.##  ",
            " ##...## ",
            "##.....##",
            "#.......#",
            "##.....##",
            " ##...## ",
            "  ##.##  ",
            "   ###   ",
        ], [4,4])
}
const plusRoom = (range:[number,number],rng:Random, theme:Theme) => {
    return templateRoom(range, rng, theme,
        [
            "   ###   ",
            "   #.#   ",
            "   #.#   ",
            "####.####",
            "#.......#",
            "####.####",
            "   #.#   ",
            "   #.#   ",
            "   ###   ",

        ], [4,4])
}

export { rectangleRoom, octoRoom, plusRoom, octoRoomSmall, hollowSquareRoom };