import { IsString, IsNotEmpty } from 'class-validator';

export class ClientLoginDto {
  @IsString()
  @IsNotEmpty()
  accessCode: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
