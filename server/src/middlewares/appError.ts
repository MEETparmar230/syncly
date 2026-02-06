
class appError extends Error{

    public statusCode:number;
    public isOperational:boolean;

    constructor(message:string, status:number){
        super(message)

        this.statusCode = status;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
}

export default appError;