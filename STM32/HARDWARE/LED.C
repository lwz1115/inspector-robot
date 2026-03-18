#include "led.h"

int Led_Count=500; //LED flicker time control //LED闪烁时间控制

/**************************************************************************
Function: LED interface initialization
Input   : none
Output  : none
功能描述：LED接口初始化
入口参数：无
返回  值：无
**************************************************************************/
void LED_Init(void)
{
	GPIO_InitTypeDef  GPIO_InitStructure;
	
  RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOA, ENABLE);//使能GPIOB时钟
  GPIO_InitStructure.GPIO_Pin =  LED_PIN;//LED对应IO口
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_OUT;//普通输出模式
  GPIO_InitStructure.GPIO_OType = GPIO_OType_PP;//推挽输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_100MHz;//100MHz
  GPIO_InitStructure.GPIO_PuPd = GPIO_PuPd_UP;//上拉
  GPIO_Init(GPIOA, &GPIO_InitStructure);//初始化GPIO
	GPIO_SetBits(GPIOA,GPIO_Pin_12);
}
/**************************************************************************
Function: Buzzer interface initialized
Input   : none
Output  : none
功能描述：蜂鸣器接口初始化
入口参数：无
返回  值：无
**************************************************************************/
void Buzzer_Init(void)
{	
	GPIO_InitTypeDef  GPIO_InitStructure;
	
  RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOA, ENABLE);//使能GPIOB时钟
  GPIO_InitStructure.GPIO_Pin =  Buzzer_PIN;//LED对应IO口
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_OUT;//普通输出模式
  GPIO_InitStructure.GPIO_OType = GPIO_OType_PP;//推挽输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_100MHz;//100MHz
  GPIO_InitStructure.GPIO_PuPd = GPIO_PuPd_UP;//上拉
  GPIO_Init(GPIOA, &GPIO_InitStructure);//初始化GPIO
}
/**************************************************************************
Function: LED light flashing task
Input   : none
Output  : none
功能描述：LED灯闪烁任务
入口参数：无
返回  值：无
**************************************************************************/
void led_task(void *pvParameters)
{
    while(1)
    {
			//The status of the LED is reversed. 0 is on and 1 is off
			//LED状态取反，0是点亮，1是熄灭
      LED=~LED;              
      //The LED flicker task is very simple, requires low frequency accuracy, and uses the relative delay function
      //LED闪烁任务很简单，对频率精度要求低，使用相对延时函数
      vTaskDelay(Led_Count); 
    }
}  

/**************************************************************************
Function: The LED flashing
Input   : none
Output  : blink time
功能描述：LED闪烁
入口参数：闪烁时间
返 回 值：无
**************************************************************************/
void Led_Flash(u16 time)
{
	  static int temp;
	  if(0==time) LED=0;
	  else		if(++temp==time)	LED=~LED,temp=0;
}


/* ================================================================
   DHT11 温湿度传感器  引脚: PA5
   ================================================================ */
u8 DHT11_Temp = 0;
u8 DHT11_Humi = 0;

void DHT11_Init(void)
{
    RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOA, ENABLE);
    DHT11_OUT_MODE();
    DHT11_OUT = 1;
}

/* 等待引脚变为指定电平，超时返回1 */
static u8 DHT11_Wait(u8 level, u16 timeout_us)
{
    while(DHT11_IN != level){
        if(--timeout_us == 0) return 1;
        delay_us(1);
    }
    return 0;
}

/* 读取一个字节 */
static u8 DHT11_Read_Byte(void)
{
    u8 i, dat = 0;
    for(i = 0; i < 8; i++){
        dat <<= 1;
        DHT11_Wait(0, 100);          // 等低电平结束
        delay_us(40);                // 40us后采样
        if(DHT11_IN) dat |= 1;
        DHT11_Wait(1, 100);          // 等高电平结束
    }
    return dat;
}

/* 读取温湿度，成功返回0，失败返回1 */
u8 DHT11_Read_Data(u8 *temp, u8 *humi)
{
    u8 buf[5];
    u8 i;

    /* 主机发送起始信号 */
    DHT11_OUT_MODE();
    DHT11_OUT = 0;
    delay_ms(20);       // 拉低至少18ms
    DHT11_OUT = 1;
    delay_us(30);

    /* 切换为输入，等待DHT11响应 */
    DHT11_IN_MODE();
    if(DHT11_Wait(0, 100)) return 1;  // 等低电平响应
    if(DHT11_Wait(1, 100)) return 1;  // 等高电平
    if(DHT11_Wait(0, 100)) return 1;  // 等数据开始

    /* 读5字节 */
    for(i = 0; i < 5; i++)
        buf[i] = DHT11_Read_Byte();

    DHT11_OUT_MODE();
    DHT11_OUT = 1;

    /* 校验 */
    if(buf[4] != (u8)(buf[0]+buf[1]+buf[2]+buf[3]))
        return 1;

    *humi = buf[0];
    *temp = buf[2];
    return 0;
}
