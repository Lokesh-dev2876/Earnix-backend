import { IsEmail, IsString, Length } from 'class-validator';

export class LoginWithPinDto {
    @IsEmail()
    email: string;

    @IsString()
    @Length(4, 4)
    pin: string;

    @IsString()
    deviceId: string;
}
