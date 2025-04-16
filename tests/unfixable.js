function originalColor() {
  // using CSI color begin and end in code may break when highlight match
  console.log(`\x1B[42m begin green background`);
  console.log(`This should be green background`);
  console.log(`some ERROR oops.`); // this break
  console.log(`This should be green background`);
  console.log(`This should be green background`);
  console.log(`end green background \x1B[0m`);
}

function main() {
  originalColor();
}

main();
