#include "control.h"	
#include "filter.h"	
  /**************************************************************************
作者：平衡小车之家
购买地址：http://shop114407458.taobao.com/
**************************************************************************/

u8 Flag_Target,Flag_Change;                             //开关标志位
u8 temp1;                                               //临时变量
float Voltage_Count,Voltage_All; 											  //电压计数、累加变量
float Gyro_K=0.004;     				  											//陀螺仪比例系数
int j;
#define a_PARAMETER          (0.275f)   
#define T 0.320f    //0.145f
#define L 0.315f    //0.17f
#define K 570.8f
/**************************************************************************
功能描述：小车运动学模型
入口参数：Y轴速度和角度
返回  值：无
**************************************************************************/
void Kinematic_Analysis(float Vy,float angle)
{
        Target_A   = Vy*(1+T*tan(angle)/2/L);
        Target_B   = Vy*(1-T*tan(angle)/2/L);
	      Servo=SERVO_INIT-angle*K;
}
/**************************************************************************
功能描述：所有的控制代码都在这里
         5ms定时中断由MPU6050的INT引脚触发
         上面保证了传感器数据处理的时间同步				 
**************************************************************************/
int EXTI15_10_IRQHandler(void) 
{    
	 if(INT==0)		
	{     
		  EXTI->PR=1<<15;                                                      //清除LINE5上的中断标志位  		
		   Flag_Target=!Flag_Target;
		  if(delay_flag==1)
			 {
				 if(++delay_50==10)	 delay_50=0,delay_flag=0;                     //该变量为提供50ms的精准延时
			 }
		  if(Flag_Target==1)                                                  //5ms读取一次陀螺仪和加速度计的值
			{
					if(Usart_Flag==0&&PS2_ON_Flag==0&&Usart_ON_Flag==1)  memcpy(rxbuf,Urxbuf,8*sizeof(u8));	//如果处于串口控制标志位，则读入串口控制模式
					Read_DMP();                                                           //===读取姿态		
			  	Key(); //扫描按键变化	
			    return 0;	                                               
			}                                                                     	 //===10ms执行一次，为了保证M法测速的时间准确稳定读取编码器数据
			UA_Encoder=Read_Encoder(2);                                          //===读取编码器数值		
			Encoder_A=UA_Encoder/25;
			Position_A+=Encoder_A;                                                 //===积分得到速度   
			UB_Encoder=-Read_Encoder(3);                                          //===读取编码器数值		
			Encoder_B=UB_Encoder/25;
			Position_B+=Encoder_B;                                                 //===积分得到速度   
	  	Read_DMP();                                                            	//===读取姿态	
  		Led_Flash(100);                                                       	 //===LED闪烁；运行模式 1s变一次指示灯的状态	
			Voltage_All+=Get_battery_volt();                                      	 //末位电压累加
			if(++Voltage_Count==100) Voltage=Voltage_All/100,Voltage_All=0,Voltage_Count=0; //平均值 读取电池电压	
		  if(PS2_KEY==4) PS2_ON_Flag=1,CAN_ON_Flag=0,Usart_ON_Flag=0;  // Start键切换到PS2控制模式串口控制
			if(RC_Velocity>0&&RC_Velocity<15)  RC_Velocity=15;                   //遥控速度最低防抖处理
			if(Turn_Off(Voltage)==0)               //===检测电池电压是否异常
			 { 			 	
				 if(CAN_ON_Flag==0&&Usart_ON_Flag==0&&PS2_ON_Flag==0)      Get_RC(Run_Flag); //===若CAN和串口控制都未使能，则处理APP遥控指令
				 Motor_A=Incremental_PI_A(Encoder_A,Target_A);                         //===速度闭环控制计算A电机的PWM
				 Motor_B=Incremental_PI_B(Encoder_B,Target_B);                         //===速度闭环控制计算B电机的PWM
				 Xianfu_Pwm(6900);                     //===PWM限幅
				 Set_Pwm(-Motor_A,-Motor_B,Servo);     //===赋值给PWM寄存器  
			 }
			 else	Set_Pwm(0,0,SERVO_INIT);    //===赋值给PWM寄存器 
	 }
	 return 0;	 
} 

/**************************************************************************
功能描述：赋值给PWM寄存器
入口参数：PWM
返回  值：无
**************************************************************************/
void Set_Pwm(int motor_a,int motor_b,int servo)
{
   	if(motor_a<0)			INA2=1,			INA1=0;
		else 	          INA2=0,			INA1=1;
		PWMA=myabs(motor_a);
	
		if(motor_b<0)			INB2=1,			INB1=0;
		else 	            INB2=0,			INB1=1;
		PWMB=myabs(motor_b);
	    SERVO=servo;
}

/**************************************************************************
功能描述：限制PWM最大值 
入口参数：限幅值
返回  值：无
**************************************************************************/
void Xianfu_Pwm(int amplitude)
{	
    if(Motor_A<-amplitude) Motor_A=-amplitude;	
		if(Motor_A>amplitude)  Motor_A=amplitude;	
	  if(Motor_B<-amplitude) Motor_B=-amplitude;	
		if(Motor_B>amplitude)  Motor_B=amplitude;
    if (Servo>1930)	 Servo=1930;
//	  if (Servo<1035)	 Servo=1035;	
}

/**************************************************************************
功能描述：位置PID控制，用于限制速度的幅度
入口参数：各轴限幅值
返回  值：无
**************************************************************************/
void Xianfu_Velocity(int amplitude_A,int amplitude_B,int amplitude_C,int amplitude_D)
{	
    if(Motor_A<-amplitude_A) Motor_A=-amplitude_A;	//位置控制模式中，A电机最大速度
		if(Motor_A>amplitude_A)  Motor_A=amplitude_A;	  //位置控制模式中，A电机最大速度
	  if(Motor_B<-amplitude_B) Motor_B=-amplitude_B;	//位置控制模式中，B电机最大速度
		if(Motor_B>amplitude_B)  Motor_B=amplitude_B;		//位置控制模式中，B电机最大速度
}

/**************************************************************************
功能描述：按键修改小车运行状态 
入口参数：无
返回  值：无
**************************************************************************/
void Key(void)
{	
	u8 tmp;
	tmp=click_N_Double(100); 
	if(tmp==2)Flag_Show=!Flag_Show; //双击切换显示模式                  
}

/**************************************************************************
功能描述：异常关闭电机
入口参数：电池电压
返回  值：1：异常  0：正常
**************************************************************************/
u8 Turn_Off( int voltage)
{
	    u8 temp;
			if(voltage<1110) //电池电压过低关闭电机
			{	                                                
      temp=1;      
      PWMA=0;
      PWMB=0;					
      }
			else
      temp=0;
      return temp;			
}

/**************************************************************************
功能描述：计算绝对值
入口参数：long int
返回  值：unsigned int
**************************************************************************/
u32 myabs(long int a)
{ 		   
	  u32 temp;
		if(a<0)  temp=-a;  
	  else temp=a;
	  return temp;
}

/**************************************************************************
功能描述：增量式PI控制器
入口参数：编码器测量值、目标速度
返回  值：电机PWM
根据增量式离散PID公式 
pwm+=Kp[e(k)-e(k-1)]+Ki*e(k)+Kd[e(k)-2e(k-1)+e(k-2)]
e(k)代表当前偏差 
e(k-1)代表上一次的偏差  以此类推 
pwm代表增量输出
在我们的速度控制闭环系统里，只使用PI控制
pwm+=Kp[e(k)-e(k-1)]+Ki*e(k)
**************************************************************************/
int Incremental_PI_A (int Encoder,int Target)
{ 	
	 static int Bias,Pwm,Last_bias;
	 Bias=Encoder-Target;                //计算偏差
	 Pwm+=Velocity_KP*(Bias-Last_bias)+Velocity_KI*Bias;   //增量式PI控制器
	 if(Pwm>7200)Pwm=7200;
	 if(Pwm<-7200)Pwm=-7200;
	 Last_bias=Bias;	                   //保存上一次偏差 
	 return Pwm;                         //增量输出
}
int Incremental_PI_B (int Encoder,int Target)
{ 	
	 static int Bias,Pwm,Last_bias;
	 Bias=Encoder-Target;                //计算偏差
	 Pwm+=Velocity_KP*(Bias-Last_bias)+Velocity_KI*Bias;   //增量式PI控制器
	 if(Pwm>7200)Pwm=7200;
	 if(Pwm<-7200)Pwm=-7200;
	 Last_bias=Bias;	                   //保存上一次偏差 
	 return Pwm;                         //增量输出
}

/**************************************************************************
功能描述：通过APP指令控制小车的遥控
入口参数：运行指令
返回  值：无
**************************************************************************/
void Get_RC(u8 mode)
{
//	  float step=0.3f;  //速度平滑控制步进值
	  if(mode==0) //速度
		{	
				 switch(Flag_Direction)   //方向控制
				 { 
				 case 1:      Move_Y=RC_Velocity;  	 	 Angle=0;        break;
				 case 2:      Move_Y=RC_Velocity;  	 	 Angle=PI/4;   	 break;
				 case 3:      Move_Y=0;      				 	 Angle=0;   	   break;
				 case 4:      Move_Y=-RC_Velocity;  	 Angle=-PI/4;    break;
				 case 5:      Move_Y=-RC_Velocity;  	 Angle=0;        break;
				 case 6:      Move_Y=-RC_Velocity;  	 Angle=PI/4;     break;
				 case 7:      Move_Y=0;     	 			 	 Angle=0;        break;
				 case 8:      Move_Y=+RC_Velocity; 	 	 Angle=-PI/4;    break; 
				 default:     Move_Y=0;                Angle=0;        break;
			 } 
	 }
		 Kinematic_Analysis(Move_Y,Angle); //得到控制目标值，进行运动学解算
}

/**************************************************************************
功能描述：处理CAN总线和串口控制指令的写入
入口参数：无
返回  值：无
**************************************************************************/
void CAN_N_Usart_Control(void)
{
			int RX,LY;
		  int Yuzhi=20;
			if(CAN_ON_Flag==1||Usart_ON_Flag==1) 
			{
			 if(rxbuf[1]==0)Move_Y=rxbuf[0]; //识别运动方向
			 else           Move_Y=-rxbuf[0]; //速度
			 Angle=(rxbuf[2]-90)*PI/180;   //角度获取
			}
			else if (PS2_ON_Flag==1)
	    {
	     RX=PS2_RX-128;
			 LY=PS2_LY-128;
			 if(RX>-Yuzhi&&RX<Yuzhi)RX=0; //摇杆死区处理
			 if(LY>-Yuzhi&&LY<Yuzhi)LY=0;
		   Angle= RX*PI/4/120;
		   Move_Y=-LY/2.84;	 
	    }
			Kinematic_Analysis(Move_Y,Angle); //得到控制目标值，进行运动学解算
}
