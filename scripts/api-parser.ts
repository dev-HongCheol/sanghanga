import * as fs from 'fs-extra';
import * as path from 'path';
import * as XLSX from 'xlsx';

/**
 * 키움 REST API 엑셀 문서를 마크다운으로 변환하는 파서
 * 인코딩 문제 및 시트명 매칭 로직 개선 버전
 */

const EXCEL_PATH = 'document/prd/api-parser/kiwoom-api-docs.xlsx';
const OUTPUT_BASE = 'document/api';

interface ApiInfo {
  apiId: string;
  apiName: string;
  mainCategory: string;
  subCategory: string;
  url: string;
  relativeFilePath?: string;
}

function clean(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/\r\n/g, '\n');
}

async function parseExcel() {
  console.log(`[Parser] Loading: ${EXCEL_PATH}...`);
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetNames = workbook.SheetNames;

  // 1. 목차(첫 번째 시트) 파싱
  const indexSheet = workbook.Sheets[sheetNames[0]];
  const indexData: any[] = XLSX.utils.sheet_to_json(indexSheet);
  
  const apiList: ApiInfo[] = [];

  console.log('[Parser] Analyzing index sheet...');
  
  for (const row of indexData) {
    const apiId = clean(row['__EMPTY']); // Column B: API ID
    // 'au10001' 또는 'ka'로 시작하는 ID만 필터링
    if (apiId && (apiId.startsWith('au') || apiId.startsWith('ka'))) {
      apiList.push({
        apiId: apiId,
        apiName: clean(row['__EMPTY_1']), // Column C: API 명
        mainCategory: clean(row['__EMPTY_2']), // Column D: 대분류
        subCategory: clean(row['__EMPTY_3']), // Column E: 중분류 (없을 경우 대분류와 병합되었을 수 있음)
        url: clean(row['__EMPTY_4']), // Column F: URL
      });
    }
  }

  console.log(`[Parser] Found ${apiList.length} APIs in index.`);

  const successApis: ApiInfo[] = [];

  for (const api of apiList) {
    // 시트 이름에서 (API_ID) 가 포함된 시트 찾기
    const sheetName = sheetNames.find(name => name.includes(`(${api.apiId})`));
    
    if (!sheetName) {
      console.warn(`[Parser] Sheet not found for API ID: ${api.apiId}`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let markdown = `# ${api.apiId} - ${api.apiName}\n\n`;
    
    let currentSection = '';
    let tableHeader: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const firstCol = clean(row[0]);

      // 섹션 감지 (이미지 기반 키워드 매칭)
      if (firstCol === 'API 정보') {
        markdown += `## 1. API 정보\n| 항목 | 내용 |\n| :--- | :--- |\n`;
        currentSection = 'API_INFO';
        continue;
      } else if (firstCol === '기본정보') {
        markdown += `\n## 2. 기본 정보\n| 항목 | 내용 |\n| :--- | :--- |\n`;
        currentSection = 'BASE_INFO';
        continue;
      } else if (firstCol === '개요') {
        markdown += `\n## 3. 개요\n`;
        currentSection = 'SUMMARY';
        continue;
      } else if (firstCol === 'Request') {
        markdown += `\n## 4. Request\n`;
        currentSection = 'REQUEST_TABLE';
        tableHeader = [];
        continue;
      } else if (firstCol === 'Response') {
        markdown += `\n## 5. Response\n`;
        currentSection = 'RESPONSE_TABLE';
        tableHeader = [];
        continue;
      } else if (firstCol === 'Request Example') {
        markdown += `\n## 6. Request Example\n\`\`\`json\n`;
        currentSection = 'REQ_EXAMPLE';
        continue;
      } else if (firstCol === 'Response Example') {
        markdown += `\n## 7. Response Example\n\`\`\`json\n`;
        currentSection = 'RES_EXAMPLE';
        continue;
      }

      // 섹션별 데이터 처리
      switch (currentSection) {
        case 'API_INFO':
        case 'BASE_INFO':
          if (row[0] && row[1] && clean(row[0]) !== firstCol) { // 라벨-밸류 쌍
             markdown += `| **${clean(row[0])}** | ${clean(row[1])} |\n`;
          } else if (row[0] && row[2]) { // 가끔 2번 컬럼에 값이 있는 경우
             markdown += `| **${clean(row[0])}** | ${clean(row[2])} |\n`;
          }
          break;
        case 'SUMMARY':
          if (row[0] && clean(row[0]) !== '개요') markdown += `${clean(row[0])}\n`;
          break;
        case 'REQUEST_TABLE':
        case 'RESPONSE_TABLE':
          if (firstCol === '구분' || firstCol === 'Element') {
            tableHeader = row.map(c => clean(c)).filter(c => c);
            markdown += `| ${tableHeader.join(' | ')} |\n`;
            markdown += `| ${tableHeader.map(() => ':---').join(' | ')} |\n`;
          } else if (tableHeader.length > 0 && row.some(c => c)) {
            const rowData = row.slice(0, tableHeader.length).map(c => clean(c));
            while (rowData.length < tableHeader.length) rowData.push('');
            markdown += `| ${rowData.join(' | ')} |\n`;
          }
          break;
        case 'REQ_EXAMPLE':
        case 'RES_EXAMPLE':
          if (row[0] && clean(row[0]) !== 'Request Example' && clean(row[0]) !== 'Response Example') {
            markdown += `${clean(row[0])}\n`;
          }
          break;
      }
    }
    
    // 예시 블록 닫기
    if (markdown.includes('```json\n') && !markdown.trim().endsWith('```')) {
        markdown += '```\n';
    }

    // 파일 저장
    const mainDir = api.mainCategory || 'General';
    const subDir = api.subCategory || 'Etc';
    const fileName = `${api.apiId}_${api.apiName.replace(/[\s\\/*?:"<>|]/g, '_')}.md`;
    const fullDirPath = path.join(OUTPUT_BASE, mainDir, subDir);
    const fullFilePath = path.join(fullDirPath, fileName);

    await fs.ensureDir(fullDirPath);
    await fs.writeFile(fullFilePath, markdown, 'utf-8');
    
    // 성공 목록에 추가 (인덱스 생성용)
    api.relativeFilePath = `./${path.join(mainDir, subDir, fileName).replace(/\\/g, '/')}`;
    successApis.push(api);
    
    console.log(`[Parser] Generated: ${fullFilePath}`);
  }

  // 2. index.md 생성
  console.log('[Parser] Generating index.md...');
  let indexMarkdown = `# 키움 REST API 전체 목록\n\n`;
  indexMarkdown += `이 문서는 자동으로 생성되었습니다. 상세 내용은 각 링크를 참조하세요.\n\n`;

  // 대분류 > 중분류 그룹화
  const grouped: Record<string, Record<string, ApiInfo[]>> = {};
  for (const api of successApis) {
    const main = api.mainCategory || 'General';
    const sub = api.subCategory || 'Etc';
    if (!grouped[main]) grouped[main] = {};
    if (!grouped[main][sub]) grouped[main][sub] = [];
    grouped[main][sub].push(api);
  }

  for (const main of Object.keys(grouped).sort()) {
    indexMarkdown += `## ${main}\n\n`;
    for (const sub of Object.keys(grouped[main]).sort()) {
      indexMarkdown += `### ${sub}\n\n`;
      indexMarkdown += `| API ID | API 명 | 상세 문서 |\n`;
      indexMarkdown += `| :--- | :--- | :--- |\n`;
      for (const api of grouped[main][sub]) {
        indexMarkdown += `| **${api.apiId}** | ${api.apiName} | [바로가기](${api.relativeFilePath}) |\n`;
      }
      indexMarkdown += `\n`;
    }
  }

  await fs.writeFile(path.join(OUTPUT_BASE, 'index.md'), indexMarkdown, 'utf-8');
  console.log(`[Parser] Generated: ${path.join(OUTPUT_BASE, 'index.md')}`);

  console.log('\n[Parser] All API documents and index have been generated successfully.');
}

parseExcel().catch(err => {
  console.error('[Parser] Error during parsing:', err);
  process.exit(1);
});
