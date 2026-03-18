#ifndef __ADC_H
#define __ADC_H	
#include "sys.h"
#include "system.h"
#define Battery_Ch    8  // 电池电压 ADC2通道8 PB0
#define Potentiometer 9  // 电位器   ADC1通道9 PB1
#define Smoke_Ch      6  // 烟雾传感器AO ADC1通道6 PA6
void Adc_Init(void);
void Adc_POWER_Init(void);
void Adc_Smoke_Init(void);
u16 Get_Adc(u8 ch);
u16 Get_Adc2(u8 ch);
float Get_battery_volt(void);
u16 Get_adc_Average(u8 chn, u8 times);
u16 Get_Smoke_Value(void);
extern float Voltage, Voltage_Count, Voltage_All;
extern u16 Smoke_Value;  // 烟雾ADC原始值 0~4095
#endif


