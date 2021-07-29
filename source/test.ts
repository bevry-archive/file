import { equal } from 'assert-helpers'
import kava from 'kava'
import { tmpdir } from 'os'
import { join } from 'path'
import { cwd } from 'process'
import {
	isPresent,
	isReadable,
	isWritable,
	readFile,
	writeFile,
	deleteFile,
	readdir,
} from './index.js'

kava.suite('@bevry/file', function (suite, test) {
	test('file works as expected', function (done) {
		Promise.resolve()
			.then(async function () {
				const tmp = join(tmpdir(), 'bevry-file.txt')
				await deleteFile(tmp) // ensure it does not exist, should not fail if it does not exist
				const data = String(Math.random())
				equal(
					await isPresent(tmp),
					false,
					'is not present when it is not present'
				)
				equal(
					await isReadable(tmp),
					false,
					'is not readable when it is not present'
				)
				equal(
					await isWritable(tmp),
					false,
					'is not writable when it is not present'
				)
				await writeFile(tmp, data)
				equal(await isPresent(tmp), true, 'is present when it is present')
				equal(await isReadable(tmp), true, 'is readable when it is present')
				equal(await readFile(tmp), data, 'has the data we expected')
				equal(await isWritable(tmp), true, 'is writable when it is present')
				await deleteFile(tmp)
				equal(await isPresent(tmp), false, 'is not present when deleted')
				equal(await isReadable(tmp), false, 'is not readable when deleted')
				equal(await isWritable(tmp), false, 'is not writable when deleted')
			})
			.finally(done)
	})
	test('dir works as expected', function (done) {
		Promise.resolve()
			.then(async function () {
				const files = await readdir(cwd())
				console.log(files)
			})
			.finally(done)
	})
})
