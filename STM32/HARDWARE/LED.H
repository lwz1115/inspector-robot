#ifndef __LED_H
#define __LED_H
#include "sys.h"
#include "system.h"

#define LED_TASK_PRIO		3
#define LED_STK_SIZE 		128

/*--------Buzzer control pin--------*/
#define Buzzer_PORT GPIOA
#define Buzzer_PIN GPIO_Pin_8
#define Buzzer PAout(8)
/*----------------------------------*/

/*--------LED control pin--------*/
#define LED_PORT GPIOA
#define LED_PIN GPIO_Pin_12
#define LED PAout(12) 
/*----------------------------------*/

/*--------DHT11 control pin PA5--------*/
#define DHT11_PORT     GPIOA
#define DHT11_PIN      GPIO_Pin_5
#define DHT11_OUT      PAout(5)
#define DHT11_IN       PAin(5)
#define DHT11_OUT_MODE() do{ \
    GPIO_InitTypeDef g; \
    g.GPIO_Pin=DHT11_PIN; g.GPIO_Mode=GPIO_Mode_OUT; \
    g.GPIO_OType=GPIO_OType_PP; g.GPIO_Speed=GPIO_Speed_50MHz; \
    g.GPIO_PuPd=GPIO_PuPd_UP; GPIO_Init(DHT11_PORT,&g); }while(0)
#define DHT11_IN_MODE()  do{ \
    GPIO_InitTypeDef g; \
    g.GPIO_Pin=DHT11_PIN; g.GPIO_Mode=GPIO_Mode_IN; \
    g.GPIO_Speed=GPIO_Speed_50MHz; \
    g.GPIO_PuPd=GPIO_PuPd_UP; GPIO_Init(DHT11_PORT,&g); }while(0)
/*----------------------------------*/

void LED_Init(void);  
void Buzzer_Init(void); 
void Led_Flash(u16 time);
void led_task(void *pvParameters);

/* DHT11 */
void DHT11_Init(void);
u8   DHT11_Read_Data(u8 *temp, u8 *humi);

extern int Led_Count;
extern u8 DHT11_Temp;   // 温度 (°C)
extern u8 DHT11_Humi;   // 湿度 (%)
#endif
