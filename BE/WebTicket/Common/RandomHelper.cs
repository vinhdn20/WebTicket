using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Common
{
    public static class RandomHelper
    {
        public static int GetRandomInt(this RandomNumberGenerator rng, int maxValue = int.MaxValue)
        {
            if (maxValue <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(maxValue), "maxValue must be greater than 0.");
            }

            byte[] data = new byte[4];
            rng.GetBytes(data);
            uint value = BitConverter.ToUInt32(data, 0);
            return (int)(value % (uint)maxValue);
        }
        public static int GetRandomIntInRange(this RandomNumberGenerator rng, int minValue, int maxValue)
        {
            if (minValue >= maxValue)
            {
                throw new ArgumentOutOfRangeException(nameof(maxValue), "maxValue must be greater than minValue.");
            }

            int range = maxValue - minValue + 1;
            byte[] data = new byte[4];
            rng.GetBytes(data);
            uint value = BitConverter.ToUInt32(data, 0);

            return (int)(value % (uint)range) + minValue;
        }
    }
}
