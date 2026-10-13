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
          @page {
            size: A4 landscape;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #FFFFFF;
            width: 297mm;
            height: 210mm;
            overflow: hidden;
          }

          .certificate {
            width: 297mm;
            height: 210mm;
            padding: 12mm;
            background: linear-gradient(135deg, #FAFDFA 0%, #FFFFFF 40%, #FFFBF5 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Marco decorativo exterior */
          .outer-border {
            position: absolute;
            top: 8mm;
            left: 8mm;
            right: 8mm;
            bottom: 8mm;
            border: 3px solid #2E7D32;
            border-radius: 4px;
          }

          /* Marco decorativo interior */
          .inner-border {
            position: absolute;
            top: 11mm;
            left: 11mm;
            right: 11mm;
            bottom: 11mm;
            border: 1px solid #A5D6A7;
            border-radius: 2px;
          }

          /* Ornamentos en las esquinas */
          .corner {
            position: absolute;
            width: 18mm;
            height: 18mm;
            border: 3px solid #FF9800;
          }
          .corner-tl { top: 8mm; left: 8mm; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
          .corner-tr { top: 8mm; right: 8mm; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
          .corner-bl { bottom: 8mm; left: 8mm; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
          .corner-br { bottom: 8mm; right: 8mm; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

          /* Contenido */
          .content {
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
            padding: 15mm 20mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
          }

          /* Encabezado */
          .header {
            width: 100%;
            text-align: center;
          }

          .seal-top {
            font-size: 32px;
            color: #FF9800;
            margin-bottom: 4px;
            letter-spacing: 8px;
          }

          .title {
            font-size: 40px;
            font-weight: 900;
            color: #1B5E20;
            letter-spacing: 8px;
            margin-bottom: 2px;
          }

          .subtitle {
            font-size: 14px;
            color: #666;
            letter-spacing: 6px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .divider {
            width: 60mm;
            height: 2px;
            background: linear-gradient(90deg, transparent, #FF9800, transparent);
            margin: 0 auto;
          }

          /* Cuerpo del certificado */
          .body {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
          }

          .presented-to {
            font-size: 13px;
            color: #888;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .recipient-name {
            font-size: 46px;
            font-weight: 700;
            color: #1B5E20;
            font-family: 'Georgia', serif;
            font-style: italic;
            padding: 4px 20px;
            border-bottom: 2px solid #2E7D32;
            margin-bottom: 12px;
            min-width: 150mm;
          }

          .completion-text {
            font-size: 14px;
            color: #555;
            margin-bottom: 6px;
          }

          .volume-title {
            font-size: 22px;
            font-weight: 700;
            color: #2E7D32;
            margin-bottom: 4px;
          }

          .volume-subtitle {
            font-size: 12px;
            color: #888;
            font-style: italic;
            margin-bottom: 8px;
          }

          .seal-center {
            font-size: 42px;
            color: #FF9800;
            margin: 4px 0;
          }

          .description {
            font-size: 13px;
            color: #666;
            line-height: 1.5;
            max-width: 200mm;
          }

          /* Pie de página */
          .footer {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 8px;
          }

          .signature-block {
            text-align: center;
            width: 60mm;
          }

          .signature-line {
            width: 100%;
            height: 1px;
            background: #333;
            margin-bottom: 4px;
          }

          .signature-label {
            font-size: 11px;
            color: #666;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .date-block {
            text-align: center;
            font-size: 12px;
            color: #555;
          }

          .date-label {
            font-size: 11px;
            color: #888;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 4px;
          }

          .points-info {
            font-size: 11px;
            color: #FF9800;
            font-weight: 700;
            margin-top: 4px;
          }

          /* Versículo inferior */
          .verse {
            font-size: 10px;
            color: #999;
            font-style: italic;
            text-align: center;
            margin-top: 6px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="outer-border"></div>
          <div class="inner-border"></div>
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>

          <div class="content">
            <!-- ENCABEZADO -->
            <div class="header">
              <div class="seal-top">✦ ✦ ✦</div>
              <div class="title">CERTIFICADO</div>
              <div class="subtitle">de finalización</div>
              <div class="divider"></div>
            </div>

            <!-- CUERPO -->
            <div class="body">
              <div class="presented-to">Este certificado se otorga a</div>
              <div class="recipient-name">${userName}</div>
              <div class="completion-text">Por haber completado satisfactoriamente el estudio de</div>
              <div class="volume-title">Vol. ${volumeNumber}: ${volumeTitle}</div>
              <div class="volume-subtitle">Serie "Vida en Abundancia"</div>
              <div class="seal-center">🏆</div>
              <div class="description">
                Demostrando dedicación y compromiso con su crecimiento espiritual.
              </div>
            </div>

            <!-- PIE DE PÁGINA -->
            <div class="footer">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Maestro / Discipulador</div>
              </div>

              <div class="date-block">
                <div class="date-label">Fecha de finalización</div>
                <div style="font-size: 13px; color: #333; margin-top: 2px;">${completedDate}</div>
                <div class="points-info">★ ${totalPoints} puntos acumulados ★</div>
              </div>

              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Firma Autorizada</div>
              </div>
            </div>

            <div class="verse">
              "Lámpara es a mis pies tu palabra, y lumbrera a mi camino." — Salmo 119:105
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { base64 } = await Print.printToFileAsync({
      html,
      base64: true,
    });

    const fileName = `Certificado_Vol${volumeNumber}_${Date.now()}.pdf`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('✅ Certificado guardado en:', fileUri);

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