export default class InputManager{
    static onKey:(key:string)=>any

    static init(onKey:(key:string)=>any){
        InputManager.onKey=onKey;
        window.addEventListener("keyup",(e:KeyboardEvent)=>{
            const keyStr:string=e.key;//console.log(keyStr)
            onKey(keyStr);
        });
    }

}