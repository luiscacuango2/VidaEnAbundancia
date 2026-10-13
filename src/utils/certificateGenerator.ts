// src/utils/certificateGenerator.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Alert } from 'react-native';

interface CertificateData {
  userName: string;
  volumeTitle: string;
  volumeNumber: number;
  completedDate: string;
  totalPoints: number;
}

export const generateCertificate = async (data: CertificateData) => {
  const { userName, volumeTitle, volumeNumber, completedDate, totalPoints } = data;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4 landscape; margin: 0; }
          body { font-family: 'Georgia', serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .certificate {
            width: 100%; height: 100vh; padding: 40px;
            background: linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 50%, #FFF3E0 100%);
            border: 20px solid #2E7D32; box-sizing: border-box;
            display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
          }
          .header { font-size: 48px; color: #2E7D32; font-weight: bold; margin-bottom: 10px; letter-spacing: 4px; }
          .subtitle { font-size: 20px; color: #666; margin-bottom: 40px; font-style: italic; }
          .divider { width: 200px; height: 3px; background: #FF9800; margin: 20px auto; }
          .presented-to { font-size: 18px; color: #555; margin-bottom: 20px; }
          .recipient-name {
            font-size: 42px; color: #1B5E20; font-weight: bold; margin: 20px 0;
            border-bottom: 2px solid #2E7D32; padding-bottom: 10px; display: inline-block; min-width: 400px;
          }
          .description { font-size: 18px; color: #555; line-height: 1.6; max-width: 700px; margin: 30px auto; }
          .volume-title { font-size: 24px; color: #2E7D32; font-weight: bold; font-style: italic; margin: 20px 0; }
          .footer { display: flex; justify-content: space-around; width: 100%; margin-top: 60px; padding: 0 60px; }
          .signature { text-align: center; border-top: 2px solid #333; padding-top: 10px; width: 200px; }
          .signature-label { font-size: 14px; color: #666; font-style: italic; }
          .date { font-size: 16px; color: #555; margin-top: 40px; }
          .seal { font-size: 60px; color: #FF9800; margin: 20px 0; }
          .verse { font-size: 14px; color: #666; font-style: italic; margin-top: 30px; max-width: 700px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">CERTIFICADO</div>
          <div class="subtitle">de finalización</div>
          <div class="divider"></div>
          <div class="presented-to">Este certificado se otorga con orgullo a:</div>
          <div class="recipient-name">${userName}</div>
          <div class="description">Por haber completado satisfactoriamente el estudio de</div>
          <div class="volume-title">Vol. ${volumeNumber}: ${volumeTitle}</div>
          <div class="seal">🏆</div>
          <div class="description">
            de la serie <strong>"Nueva Vida en Cristo"</strong>, 
            demostrando dedicación y compromiso con el crecimiento espiritual.
          </div>
          <div class="date">
            Completado el ${completedDate} | Total acumulado: ${totalPoints} puntos
          </div>
          <div class="footer">
            <div class="signature"><div class="signature-label">Maestro / Discipulador</div></div>
            <div class="signature"><div class="signature-label">Fecha</div></div>
          </div>
          <div class="verse">
            "Lámpara es a mis pies tu palabra, y lumbrera a mi camino." — Salmo 119:105
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    // 1. Generar el PDF con base64 incluido
    // Esto evita tener que copiar archivos y soluciona el problema de permisos.
    const { base64 } = await Print.printToFileAsync({ 
      html,
      base64: true 
    });

    // 2. Escribir el PDF en un archivo temporal accesible
    // Usamos el API legacy porque funciona sin problemas en Expo Go.
    const fileName = `Certificado_Vol${volumeNumber}_${Date.now()}.pdf`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    // Escribimos la cadena base64 en el archivo
    await FileSystem.writeAsStringAsync(fileUri, base64!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('✅ Certificado guardado en:', fileUri);

    // 3. Compartir el archivo
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Certificado',
        UTI: 'com.adobe.pdf',
      });
      return { success: true, uri: fileUri };
    } else {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Certificado Generado',
          'El certificado se generó correctamente. En el navegador no se puede compartir directamente.'
        );
      }
      return { success: true, uri: fileUri };
    }
  } catch (error) {
    console.error('❌ Error generando certificado:', error);
    return { success: false, error };
  }
};