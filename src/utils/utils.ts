export function getRndNum(min:number,max:number,exclude:number[]=[]):number{
    let brk:number=0;
    let num:number=Math.floor(Math.random()*(max-min))+min;
    while(exclude.includes(num)){
        num=Math.floor(Math.random()*(max-min))+min;
        brk++;
        if(brk>100)break;
    }
    return num;
}

export function getRndNums(min:number,max:number,count:number,include:number[]=[],unique:boolean=false):number[]{
    let res:number[]=[...include];
    while(res.length<count){
        let newNum:number=getRndNum(min,max);
        if(unique){
            while(res.includes(newNum))newNum=getRndNum(min,max);
        }
        res.push(newNum);
    }
    return res;
}